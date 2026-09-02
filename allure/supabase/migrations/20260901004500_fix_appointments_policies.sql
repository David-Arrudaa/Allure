-- Remove as 4 policies simples inseridas erroneamente na migration de tenant isolation.
-- Elas (FOR ALL e sem RBAC) somavam com as policies "Appointments Policy - *", 
-- anulando a regra que impedia profissionais normais de verem agendas alheias.

DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments - Select" ON appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments - Insert" ON appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments - Update" ON appointments;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Appointments - Delete" ON appointments;
