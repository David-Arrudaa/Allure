-- Migration: Módulo de Cursos & Separação Financeira
-- Descrição: Criação das tabelas cursos, turmas, matriculas e matricula_pagamentos com RLS isolado por tenant.

-- ==============================================================================
-- 1. TABELA: CURSOS (Catálogo Base)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    carga_horaria VARCHAR(50) NULL,
    valor_padrao NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    vagas_padrao INTEGER NOT NULL DEFAULT 8,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_cursos_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT chk_cursos_valor CHECK (valor_padrao >= 0),
    CONSTRAINT chk_cursos_vagas CHECK (vagas_padrao >= 1)
);

-- ==============================================================================
-- 2. TABELA: TURMAS (Edições dos Cursos)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.turmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    curso_id UUID NOT NULL,
    identificador VARCHAR(100) NOT NULL, -- Ex: "Turma Março/2026", "Turma 01"
    data_inicio DATE NOT NULL,
    data_fim DATE NULL,
    horario VARCHAR(100) NULL, -- Ex: "09:00 às 18:00"
    instrutor_id UUID NULL,
    valor_turma NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    vagas_totais INTEGER NOT NULL DEFAULT 8,
    status VARCHAR(30) NOT NULL DEFAULT 'aberta', -- 'aberta', 'em_andamento', 'concluida', 'cancelada'
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_turmas_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_turmas_curso FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE,
    CONSTRAINT fk_turmas_instrutor FOREIGN KEY (instrutor_id) REFERENCES public.profissionais(id) ON DELETE SET NULL,
    CONSTRAINT chk_turmas_status CHECK (status IN ('aberta', 'em_andamento', 'concluida', 'cancelada')),
    CONSTRAINT chk_turmas_valor CHECK (valor_turma >= 0),
    CONSTRAINT chk_turmas_vagas CHECK (vagas_totais >= 1)
);

-- ==============================================================================
-- 3. TABELA: MATRICULAS (Alunas por Turma)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.matriculas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    turma_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    valor_acordado NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'pendente', -- 'pendente', 'sinal_pago', 'pago'
    data_matricula TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_matriculas_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_matriculas_turma FOREIGN KEY (turma_id) REFERENCES public.turmas(id) ON DELETE CASCADE,
    CONSTRAINT fk_matriculas_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT,
    CONSTRAINT uq_matricula_turma_customer UNIQUE (turma_id, customer_id),
    CONSTRAINT chk_matriculas_status CHECK (status_pagamento IN ('pendente', 'sinal_pago', 'pago')),
    CONSTRAINT chk_matriculas_valor CHECK (valor_acordado >= 0)
);

-- ==============================================================================
-- 4. TABELA: MATRICULA_PAGAMENTOS (Lançamentos Financeiros Isolados)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.matricula_pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    matricula_id UUID NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL DEFAULT 'Pix',
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_lancamento VARCHAR(30) NOT NULL DEFAULT 'integral', -- 'sinal', 'restante', 'integral', 'avulso'
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_matricula_pagamentos_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_matricula_pagamentos_matricula FOREIGN KEY (matricula_id) REFERENCES public.matriculas(id) ON DELETE CASCADE,
    CONSTRAINT chk_matricula_pagamentos_valor CHECK (valor > 0),
    CONSTRAINT chk_matricula_pagamentos_tipo CHECK (tipo_lancamento IN ('sinal', 'restante', 'integral', 'avulso'))
);

-- ==============================================================================
-- 5. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_cursos_tenant_ativo ON public.cursos (tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant_curso ON public.turmas (tenant_id, curso_id);
CREATE INDEX IF NOT EXISTS idx_turmas_tenant_status ON public.turmas (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_turmas_data_inicio ON public.turmas (tenant_id, data_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_matriculas_turma ON public.matriculas (turma_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_customer ON public.matriculas (customer_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_tenant ON public.matriculas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_matricula_pagamentos_matricula ON public.matricula_pagamentos (matricula_id);
CREATE INDEX IF NOT EXISTS idx_matricula_pagamentos_tenant ON public.matricula_pagamentos (tenant_id, data_pagamento DESC);

-- ==============================================================================
-- 6. TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA DE STATUS DE PAGAMENTO NA MATRÍCULA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_sync_matricula_status_pagamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_matricula_id UUID;
    v_valor_acordado NUMERIC(12,2);
    v_total_pago NUMERIC(12,2);
    v_novo_status VARCHAR(30);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_matricula_id := OLD.matricula_id;
    ELSE
        v_matricula_id := NEW.matricula_id;
    END IF;

    SELECT valor_acordado INTO v_valor_acordado
    FROM public.matriculas
    WHERE id = v_matricula_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(SUM(valor), 0) INTO v_total_pago
    FROM public.matricula_pagamentos
    WHERE matricula_id = v_matricula_id;

    IF v_total_pago >= v_valor_acordado AND v_valor_acordado > 0 THEN
        v_novo_status := 'pago';
    ELSIF v_total_pago > 0 THEN
        v_novo_status := 'sinal_pago';
    ELSE
        v_novo_status := 'pendente';
    END IF;

    UPDATE public.matriculas
    SET status_pagamento = v_novo_status,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_matricula_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_matricula_pagamento ON public.matricula_pagamentos;
CREATE TRIGGER trg_sync_matricula_pagamento
    AFTER INSERT OR UPDATE OR DELETE ON public.matricula_pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_matricula_status_pagamento();

-- ==============================================================================
-- 7. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matricula_pagamentos ENABLE ROW LEVEL SECURITY;

-- Cursos: Isolamento por Tenant
DROP POLICY IF EXISTS "Cursos: Isolamento por Tenant" ON public.cursos;
CREATE POLICY "Cursos: Isolamento por Tenant" ON public.cursos
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Turmas: Isolamento por Tenant
DROP POLICY IF EXISTS "Turmas: Isolamento por Tenant" ON public.turmas;
CREATE POLICY "Turmas: Isolamento por Tenant" ON public.turmas
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Matriculas: Isolamento por Tenant
DROP POLICY IF EXISTS "Matriculas: Isolamento por Tenant" ON public.matriculas;
CREATE POLICY "Matriculas: Isolamento por Tenant" ON public.matriculas
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- Matricula Pagamentos: Isolamento por Tenant
DROP POLICY IF EXISTS "Matricula Pagamentos: Isolamento por Tenant" ON public.matricula_pagamentos;
CREATE POLICY "Matricula Pagamentos: Isolamento por Tenant" ON public.matricula_pagamentos
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

