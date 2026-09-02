-- Drop da policy antiga de profisisonais que não tinha restrições para DELETE de conta própria
DROP POLICY IF EXISTS "Tenant Isolation Policy - Profissionais" ON profissionais;

-- Recriar como políticas granulares
CREATE POLICY "Tenant Isolation Policy - Profissionais - Select" ON profissionais
    FOR SELECT
    USING (tenant_id = current_tenant_id());

CREATE POLICY "Tenant Isolation Policy - Profissionais - Insert" ON profissionais
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Tenant Isolation Policy - Profissionais - Update" ON profissionais
    FOR UPDATE
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Delete é permitido dentro do tenant, MENOS no próprio usuário
-- (Para isso, checamos o e-mail via request.jwt.claims ao invés do current_tenant_id)
CREATE POLICY "Tenant Isolation Policy - Profissionais - Delete" ON profissionais
    FOR DELETE
    USING (
      tenant_id = current_tenant_id() 
      AND email != current_setting('request.jwt.claims', true)::json->>'email'
    );
