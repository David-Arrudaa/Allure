-- Criação da Tabela whatsapp_templates com isolamento multi-tenant (RLS)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    texto TEXT NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento Multi-tenant (Seguindo o padrão de 001_rls_setup.sql)
DROP POLICY IF EXISTS "Tenant Isolation Policy - Whatsapp Templates" ON public.whatsapp_templates;

CREATE POLICY "Tenant Isolation Policy - Whatsapp Templates" ON public.whatsapp_templates
    FOR ALL
    USING (tenant_id = public.current_tenant_id());

