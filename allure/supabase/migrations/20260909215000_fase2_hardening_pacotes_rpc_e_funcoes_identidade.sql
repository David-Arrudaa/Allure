-- Migration: fase2_hardening_pacotes_rpc_e_funcoes_identidade
-- Data: 2026-09-09
-- Motivo: Auditoria da Fase 2 (seguranca). Fecha buraco de tenant isolamento
-- nas RPCs de Pacotes e restringe funcoes de identidade a usuarios autenticados.

-- 1. Restringe funcoes de identidade apenas a usuarios autenticados
-- (antes eram executaveis por anon/public via REST RPC, apesar de retornarem NULL).
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_profissional_id() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_profissional_id() TO authenticated, service_role;

-- 2. comprar_pacote: adiciona validacao estrita de tenant_id antes do INSERT.
-- Antes era SECURITY DEFINER sem checagem de tenant, permitindo criacao cross-tenant via RPC.
CREATE OR REPLACE FUNCTION public.comprar_pacote(p_cliente_id uuid, p_pacote_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id UUID;
  v_cliente_tenant_id UUID;
  v_caller_tenant_id UUID;
  v_qtd_sessoes INTEGER;
BEGIN
  v_caller_tenant_id := public.current_tenant_id();
  IF v_caller_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuario nao autenticado ou sem tenant.';
  END IF;

  SELECT tenant_id, quantidade_sessoes INTO v_tenant_id, v_qtd_sessoes
  FROM public.pacotes
  WHERE id = p_pacote_id AND tenant_id = v_caller_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pacote não encontrado ou não pertence a este estabelecimento.';
  END IF;

  SELECT tenant_id INTO v_cliente_tenant_id
  FROM public.customers
  WHERE id = p_cliente_id AND tenant_id = v_caller_tenant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente não encontrado ou não pertence a este estabelecimento.';
  END IF;

  INSERT INTO public.cliente_pacotes (tenant_id, cliente_id, pacote_id, sessoes_realizadas, sessoes_restantes, data_compra)
  VALUES (v_caller_tenant_id, p_cliente_id, p_pacote_id, 0, v_qtd_sessoes, NOW());
END;
$function$;

-- 3. usar_sessao_pacote: adiciona validacao de tenant_id antes do UPDATE.
-- Antes era SECURITY DEFINER sem checagem de tenant, permitindo descontar sessoes de outro tenant via RPC.
CREATE OR REPLACE FUNCTION public.usar_sessao_pacote(p_cliente_pacote_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_restantes INTEGER;
  v_caller_tenant_id UUID;
BEGIN
  v_caller_tenant_id := public.current_tenant_id();
  IF v_caller_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: usuario nao autenticado ou sem tenant.';
  END IF;

  SELECT sessoes_restantes INTO v_restantes
  FROM public.cliente_pacotes
  WHERE id = p_cliente_pacote_id AND tenant_id = v_caller_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pacote do cliente não encontrado ou não pertence a este estabelecimento.';
  END IF;

  IF v_restantes <= 0 THEN
    RAISE EXCEPTION 'Não há sessões restantes neste pacote.';
  END IF;

  UPDATE public.cliente_pacotes
  SET sessoes_realizadas = sessoes_realizadas + 1,
      sessoes_restantes = sessoes_restantes - 1
  WHERE id = p_cliente_pacote_id AND tenant_id = v_caller_tenant_id;
END;
$function$;
