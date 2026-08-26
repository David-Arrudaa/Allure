-- Criação da Tabela whatsapp_templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assunto TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Aplicar política RLS baseada em tenant_id
CREATE POLICY "Tenant Isolation Policy - WhatsApp Templates" ON public.whatsapp_templates
    FOR ALL
    USING (tenant_id = public.current_tenant_id());
