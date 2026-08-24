-- 1. Criação da Tabela produtos
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    preco NUMERIC NOT NULL DEFAULT 0,
    estoque INT NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e configurar política
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation Policy - Produtos" ON public.produtos
    FOR ALL
    USING (tenant_id = public.current_tenant_id());

-- 2. Rastreabilidade (Audit Logs) em appointments
-- Nota: auth.users é uma tabela nativa do Supabase
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS canceled_by UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 3. Controle de Acesso Baseado em Cargos (RBAC) em profissionais
ALTER TABLE public.profissionais
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 4. Políticas RLS
-- Funções auxiliares para verificar se é admin e o id do profissional
CREATE OR REPLACE FUNCTION public.current_user_is_admin() RETURNS BOOLEAN AS $$
  SELECT is_admin FROM public.profissionais WHERE email = current_setting('request.jwt.claims', true)::json->>'email' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_profissional_id() RETURNS UUID AS $$
  SELECT id FROM public.profissionais WHERE email = current_setting('request.jwt.claims', true)::json->>'email' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Atualizar política da tabela appointments
DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments" ON public.appointments;

CREATE POLICY "Appointments Policy" ON public.appointments
    FOR ALL
    USING (
        tenant_id = public.current_tenant_id() AND 
        (
            public.current_user_is_admin() = true OR 
            profissional_id = public.current_profissional_id()
        )
    );
