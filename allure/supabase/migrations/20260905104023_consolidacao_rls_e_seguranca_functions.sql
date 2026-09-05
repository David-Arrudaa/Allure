-- Migration: Consolidação de RLS, remoção de duplicidades e segurança das functions
-- 1. Elimina duplicidade de policies permissivas (alerta: multiple_permissive_policies)
-- 2. Adiciona policies básicas de tenant_id para tabelas com RLS ligado sem policy
-- 3. Remove tabela orfa de backup sem PK
-- 4. Revoga acesso anon às RPCs de negócio (comprar_pacote/usar_sessao_pacote) e fixa
--    search_path nas functions SECURITY DEFINER (mitiga search_path hijacking)

-- ==============================================================================
-- 1. REMOVER POLICIES DUPLICADAS NAS TABELAS PRINCIPAIS
-- Mantendo a política única consolidada com USING e WITH CHECK
-- ==============================================================================

-- CUSTOMERS: manter "Customers: Isolamento por Tenant"
DROP POLICY IF EXISTS "Tenant Isolation Policy - Customers - Delete" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Customers - Insert" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Customers - Select" ON public.customers;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Customers - Update" ON public.customers;

-- PRODUTOS: manter "Produtos: Isolamento por Tenant"
DROP POLICY IF EXISTS "Tenant Isolation Policy - Produtos - Delete" ON public.produtos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Produtos - Insert" ON public.produtos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Produtos - Select" ON public.produtos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Produtos - Update" ON public.produtos;

-- SERVICOS: manter "Servicos: Isolamento por Tenant"
DROP POLICY IF EXISTS "Tenant Isolation Policy - Servicos - Delete" ON public.servicos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Servicos - Insert" ON public.servicos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Servicos - Select" ON public.servicos;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Servicos - Update" ON public.servicos;

-- PROFISSIONAIS: consolidar
DROP POLICY IF EXISTS "Tenant Isolation Policy - Profissionais - Insert" ON public.profissionais;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Profissionais - Select" ON public.profissionais;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Profissionais - Update" ON public.profissionais;
DROP POLICY IF EXISTS "Tenant Isolation Policy - Profissionais - Delete" ON public.profissionais;
DROP POLICY IF EXISTS "Profissionais: Isolamento por Tenant" ON public.profissionais;

-- Criar políticas consolidadas para Profissionais SEM usar FOR ALL:
-- o DELETE precisa da condição extra (não pode excluir o próprio email),
-- e como policies permissivas são combinadas com OR, uma policy "FOR ALL"
-- ao lado da policy de DELETE reabriria a auto-exclusão. Por isso o DELETE
-- fica de fora da política genérica e ganha a sua própria, isolada.
CREATE POLICY "Profissionais: Select"
  ON public.profissionais
  FOR SELECT
  TO authenticated
  USING (tenant_id = current_tenant_id());

CREATE POLICY "Profissionais: Insert"
  ON public.profissionais
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Profissionais: Update"
  ON public.profissionais
  FOR UPDATE
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "Profissionais: Delete (bloqueia auto-exclusao)"
  ON public.profissionais
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND email <> (SELECT current_setting('request.jwt.claims', true)::json ->> 'email')
  );

-- APPOINTMENTS: remover duplicidades preservando a regra de que uma
-- profissional não-admin só acessa os próprios agendamentos
DROP POLICY IF EXISTS "Appointments Policy - Delete" ON public.appointments;
DROP POLICY IF EXISTS "Appointments Policy - Insert" ON public.appointments;
DROP POLICY IF EXISTS "Appointments Policy - Select" ON public.appointments;
DROP POLICY IF EXISTS "Appointments Policy - Update" ON public.appointments;
DROP POLICY IF EXISTS "Appointments: Isolamento por Tenant" ON public.appointments;

CREATE POLICY "Appointments: Isolamento por Tenant e Profissional"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (
    tenant_id = current_tenant_id()
    AND (current_user_is_admin() = true OR profissional_id = current_profissional_id())
  )
  WITH CHECK (
    tenant_id = current_tenant_id()
    AND (current_user_is_admin() = true OR profissional_id = current_profissional_id())
  );

-- ==============================================================================
-- 2. POLICIES PARA TABELAS QUE TINHAM RLS HABILITADO SEM POLICIES
-- ==============================================================================

-- PACOTES
DROP POLICY IF EXISTS "Pacotes: Isolamento por Tenant" ON public.pacotes;
CREATE POLICY "Pacotes: Isolamento por Tenant"
  ON public.pacotes
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- CLIENTE_PACOTES
DROP POLICY IF EXISTS "Cliente Pacotes: Isolamento por Tenant" ON public.cliente_pacotes;
CREATE POLICY "Cliente Pacotes: Isolamento por Tenant"
  ON public.cliente_pacotes
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- FINANCEIRO
DROP POLICY IF EXISTS "Financeiro: Isolamento por Tenant" ON public.financeiro;
CREATE POLICY "Financeiro: Isolamento por Tenant"
  ON public.financeiro
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- AVALIACOES
DROP POLICY IF EXISTS "Avaliacoes: Isolamento por Tenant" ON public.avaliacoes;
CREATE POLICY "Avaliacoes: Isolamento por Tenant"
  ON public.avaliacoes
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- INTEGRACOES_WHATSAPP
DROP POLICY IF EXISTS "Integracoes WhatsApp: Isolamento por Tenant" ON public.integracoes_whatsapp;
CREATE POLICY "Integracoes WhatsApp: Isolamento por Tenant"
  ON public.integracoes_whatsapp
  FOR ALL
  TO authenticated
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ==============================================================================
-- 3. REMOÇÃO DA TABELA ÓRFÃ appointments_backup
-- ==============================================================================
DROP TABLE IF EXISTS public.appointments_backup;

-- ==============================================================================
-- 4. SEGURANÇA DAS FUNCTIONS: REVOGAR ANON DAS RPCs DE NEGÓCIO E FIXAR SEARCH_PATH
-- ==============================================================================

-- current_tenant_id/current_profissional_id/current_user_is_admin continuam
-- acessíveis por PUBLIC (inclui anon) de propósito: elas são usadas dentro de
-- policies RLS ainda vinculadas a "TO public" em tabelas fora do escopo desta
-- migration (ex.: whatsapp_templates). Revogar aqui quebraria a avaliação
-- dessas policies para o role anon (erro de permissão em vez de zero linhas).
-- Redução de superfície de ataque nelas fica para uma migration futura, junto
-- da limpeza das policies "TO public" remanescentes.

-- comprar_pacote e usar_sessao_pacote são RPCs de negócio (mutam saldo de
-- pacotes) sem nenhuma policy dependendo delas: restringir a authenticated
-- fecha a falha real de qualquer usuário anônimo conceder sessões de pacote.
REVOKE EXECUTE ON FUNCTION public.comprar_pacote(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comprar_pacote(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.usar_sessao_pacote(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usar_sessao_pacote(uuid) TO authenticated;

-- Fixar search_path nas functions SECURITY DEFINER (mitiga search_path hijacking)
-- sem alterar quem pode executá-las
ALTER FUNCTION public.current_user_is_admin() SET search_path = public;
ALTER FUNCTION public.current_profissional_id() SET search_path = public;
ALTER FUNCTION public.current_tenant_id() SET search_path = public;
ALTER FUNCTION public.comprar_pacote(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.usar_sessao_pacote(uuid) SET search_path = public;
ALTER FUNCTION public.check_appointment_past_date() SET search_path = public;
