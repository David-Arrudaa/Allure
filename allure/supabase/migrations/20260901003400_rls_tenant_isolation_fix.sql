-- Fix Missing WITH CHECK on remaining tenant isolation policies
-- To prevent cross-tenant writes

-- servicos
DROP POLICY IF EXISTS "Tenant Isolation Policy - Servicos" ON servicos;
CREATE POLICY "Tenant Isolation Policy - Servicos - Select" ON servicos FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Servicos - Delete" ON servicos FOR DELETE USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Servicos - Insert" ON servicos FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Servicos - Update" ON servicos FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- customers
DROP POLICY IF EXISTS "Tenant Isolation Policy - Customers" ON customers;
CREATE POLICY "Tenant Isolation Policy - Customers - Select" ON customers FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Customers - Delete" ON customers FOR DELETE USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Customers - Insert" ON customers FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Customers - Update" ON customers FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- appointments
DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments" ON appointments;
CREATE POLICY "Tenant Isolation Policy - Appointments - Select" ON appointments FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Appointments - Delete" ON appointments FOR DELETE USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Appointments - Insert" ON appointments FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Appointments - Update" ON appointments FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- produtos
DROP POLICY IF EXISTS "Tenant Isolation Policy - Produtos" ON produtos;
CREATE POLICY "Tenant Isolation Policy - Produtos - Select" ON produtos FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Produtos - Delete" ON produtos FOR DELETE USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Produtos - Insert" ON produtos FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - Produtos - Update" ON produtos FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- whatsapp_templates
DROP POLICY IF EXISTS "Tenant Isolation Policy - WhatsApp Templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Whatsapp Templates" ON whatsapp_templates;
CREATE POLICY "Tenant Isolation Policy - WhatsApp Templates - Select" ON whatsapp_templates FOR SELECT USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - WhatsApp Templates - Delete" ON whatsapp_templates FOR DELETE USING (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - WhatsApp Templates - Insert" ON whatsapp_templates FOR INSERT WITH CHECK (tenant_id = current_tenant_id());
CREATE POLICY "Tenant Isolation Policy - WhatsApp Templates - Update" ON whatsapp_templates FOR UPDATE USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id());

-- corrigir appointments que tinha logica customizada (gabriela_features)
DROP POLICY IF EXISTS "Appointments Policy" ON appointments;
CREATE POLICY "Appointments Policy - Select" ON appointments FOR SELECT USING (tenant_id = public.current_tenant_id() AND (public.current_user_is_admin() = true OR profissional_id = public.current_profissional_id()));
CREATE POLICY "Appointments Policy - Delete" ON appointments FOR DELETE USING (tenant_id = public.current_tenant_id() AND (public.current_user_is_admin() = true OR profissional_id = public.current_profissional_id()));
CREATE POLICY "Appointments Policy - Insert" ON appointments FOR INSERT WITH CHECK (tenant_id = public.current_tenant_id() AND (public.current_user_is_admin() = true OR profissional_id = public.current_profissional_id()));
CREATE POLICY "Appointments Policy - Update" ON appointments FOR UPDATE USING (tenant_id = public.current_tenant_id() AND (public.current_user_is_admin() = true OR profissional_id = public.current_profissional_id())) WITH CHECK (tenant_id = public.current_tenant_id() AND (public.current_user_is_admin() = true OR profissional_id = public.current_profissional_id()));
