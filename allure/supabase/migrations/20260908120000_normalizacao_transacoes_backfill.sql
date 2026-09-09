-- ============================================================================
-- MIGRATION: Normalização de Transações (Header/Detail) & Backfill Idempotente
-- ============================================================================

BEGIN;

-- 1. TABELA HEADER: TRANSACOES
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
    tipo VARCHAR(30) NOT NULL, -- 'atendimento', 'venda_avulsa'
    customer_id UUID NULL,
    profissional_id UUID NULL,
    data_transacao TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    forma_pagamento VARCHAR(50) NULL,
    status_pagamento VARCHAR(30) NOT NULL DEFAULT 'pendente', -- 'pago', 'pendente', 'cancelado', 'estornado'
    valor_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    valor_liquido NUMERIC(12,2) GENERATED ALWAYS AS (valor_total - desconto) STORED,
    observacoes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_transacoes_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacoes_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_transacoes_profissional FOREIGN KEY (profissional_id) REFERENCES public.profissionais(id) ON DELETE SET NULL,
    CONSTRAINT chk_transacoes_tipo CHECK (tipo IN ('atendimento', 'venda_avulsa')),
    CONSTRAINT chk_transacoes_status CHECK (status_pagamento IN ('pago', 'pendente', 'cancelado', 'estornado')),
    CONSTRAINT chk_transacoes_valores CHECK (valor_total >= 0 AND desconto >= 0)
);

-- 2. TABELA DETAIL: TRANSACAO_ITENS
CREATE TABLE IF NOT EXISTS public.transacao_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT current_tenant_id(),
    transacao_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'servico', 'produto'
    servico_id UUID NULL,
    produto_id UUID NULL,
    descricao TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario NUMERIC(12,2) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT fk_transacao_itens_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacao_itens_transacao FOREIGN KEY (transacao_id) REFERENCES public.transacoes(id) ON DELETE CASCADE,
    CONSTRAINT fk_transacao_itens_servico FOREIGN KEY (servico_id) REFERENCES public.servicos(id) ON DELETE SET NULL,
    CONSTRAINT fk_transacao_itens_produto FOREIGN KEY (produto_id) REFERENCES public.produtos(id) ON DELETE SET NULL,
    CONSTRAINT chk_transacao_itens_tipo CHECK (tipo IN ('servico', 'produto')),
    CONSTRAINT chk_transacao_itens_ref CHECK (
        (tipo = 'servico' AND produto_id IS NULL) OR
        (tipo = 'produto' AND servico_id IS NULL)
    ),
    CONSTRAINT chk_transacao_itens_quantidades CHECK (quantidade > 0 AND valor_unitario >= 0 AND subtotal >= 0)
);

-- 3. GARANTE A COLUNA EM APPOINTMENTS
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS transacao_id UUID NULL;

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transacoes_tenant_data ON public.transacoes (tenant_id, data_transacao DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_customer ON public.transacoes (customer_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_profissional ON public.transacoes (profissional_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes (tenant_id, status_pagamento);

CREATE INDEX IF NOT EXISTS idx_transacao_itens_transacao ON public.transacao_itens (transacao_id);
CREATE INDEX IF NOT EXISTS idx_transacao_itens_tenant ON public.transacao_itens (tenant_id);
CREATE INDEX IF NOT EXISTS idx_transacao_itens_produto ON public.transacao_itens (produto_id) WHERE produto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transacao_itens_servico ON public.transacao_itens (servico_id) WHERE servico_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_transacao_id ON public.appointments (transacao_id) WHERE transacao_id IS NOT NULL;

-- 5. RLS POLICIES
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacao_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transacoes: Isolamento por Tenant" ON public.transacoes;
CREATE POLICY "Transacoes: Isolamento por Tenant" ON public.transacoes
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

DROP POLICY IF EXISTS "Transacao Itens: Isolamento por Tenant" ON public.transacao_itens;
CREATE POLICY "Transacao Itens: Isolamento por Tenant" ON public.transacao_itens
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT public.current_tenant_id()))
    WITH CHECK (tenant_id = (SELECT public.current_tenant_id()));

-- 6. BACKFILL LINEAR COM TRATAMENTO DE CONSTRAINTS

-- 6.1 Desativa triggers de validação de datas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_appointment_past_date'
    ) THEN
        ALTER TABLE public.appointments DISABLE TRIGGER trigger_check_appointment_past_date;
    END IF;
END $$;

-- 6.2 Remove a FK se já existir para permitir o update dos IDs
ALTER TABLE public.appointments
DROP CONSTRAINT IF EXISTS fk_appointments_transacao;

-- 6.3 Gera os IDs de transação diretamente em appointments onde estiver nulo
UPDATE public.appointments
SET transacao_id = gen_random_uuid()
WHERE transacao_id IS NULL;

-- 6.4 Insere os cabeçalhos em transacoes lendo de appointments
INSERT INTO public.transacoes (
    id,
    tenant_id,
    tipo,
    customer_id,
    profissional_id,
    data_transacao,
    forma_pagamento,
    status_pagamento,
    valor_total,
    desconto,
    created_at,
    updated_at
)
SELECT
    a.transacao_id,
    a.tenant_id,
    CASE
        WHEN a.produto_id IS NOT NULL OR a.duracao = 0 OR a.servico ILIKE 'Venda:%' THEN 'venda_avulsa'
        ELSE 'atendimento'
    END,
    a.customer_id,
    a.profissional_id,
    COALESCE(a.data_horario, a.created_at),
    a.forma_pagamento,
    COALESCE(a.pagamento, 'pendente'),
    GREATEST(COALESCE(a.valor, 0.00), 0.00),
    0.00,
    a.created_at,
    a.created_at
FROM public.appointments a
WHERE a.transacao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transacoes t WHERE t.id = a.transacao_id
);

-- 6.5 Insere os itens em transacao_itens lendo de appointments
INSERT INTO public.transacao_itens (
    tenant_id,
    transacao_id,
    tipo,
    servico_id,
    produto_id,
    descricao,
    quantidade,
    valor_unitario,
    subtotal,
    created_at
)
SELECT
    a.tenant_id,
    a.transacao_id,
    CASE
        WHEN a.produto_id IS NOT NULL OR a.duracao = 0 OR a.servico ILIKE 'Venda:%' THEN 'produto'
        ELSE 'servico'
    END,
    NULL,
    CASE
        WHEN a.produto_id IS NOT NULL OR a.duracao = 0 OR a.servico ILIKE 'Venda:%' THEN a.produto_id
        ELSE NULL
    END,
    COALESCE(NULLIF(TRIM(a.servico), ''), 'Item sem descrição'),
    GREATEST(COALESCE(a.quantidade, 1), 1),
    CASE
        WHEN GREATEST(COALESCE(a.quantidade, 1), 1) > 0 THEN
            ROUND(GREATEST(COALESCE(a.valor, 0.00), 0.00) / GREATEST(COALESCE(a.quantidade, 1), 1), 2)
        ELSE GREATEST(COALESCE(a.valor, 0.00), 0.00)
    END,
    GREATEST(COALESCE(a.valor, 0.00), 0.00),
    a.created_at
FROM public.appointments a
WHERE a.transacao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transacao_itens ti WHERE ti.transacao_id = a.transacao_id
);

-- 6.6 Recria a Foreign Key com garantia referencial
ALTER TABLE public.appointments
ADD CONSTRAINT fk_appointments_transacao
FOREIGN KEY (transacao_id) REFERENCES public.transacoes(id) ON DELETE SET NULL;

-- 6.7 Reativa o trigger de validação de datas
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_check_appointment_past_date'
    ) THEN
        ALTER TABLE public.appointments ENABLE TRIGGER trigger_check_appointment_past_date;
    END IF;
END $$;

COMMIT;
