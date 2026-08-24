-- 1. Adicionar tenant_id nas tabelas
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas baseadas no tenant_id
-- O tenant_id do usuário atual pode ser recuperado verificando o e-mail no token auth (auth.jwt()->>'email')
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM public.profissionais WHERE email = current_setting('request.jwt.claims', true)::json->>'email' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "Tenant Isolation Policy - Profissionais" ON profissionais
    FOR ALL
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Tenant Isolation Policy - Servicos" ON servicos
    FOR ALL
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Tenant Isolation Policy - Customers" ON customers
    FOR ALL
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Tenant Isolation Policy - Appointments" ON appointments
    FOR ALL
    USING (tenant_id = current_tenant_id());
