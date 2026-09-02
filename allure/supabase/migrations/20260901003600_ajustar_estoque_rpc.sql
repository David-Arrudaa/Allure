-- Ajuste atomico de estoque com trava de saldo negativo.
-- Substitui o padrao read-then-write feito no cliente (ModalRecebimentoAvulso /
-- Financeiro), que perde baixas em vendas simultaneas do mesmo produto.
-- delta negativo = baixa (venda); delta positivo = devolucao (exclusao/edicao).
--
-- SECURITY INVOKER: a RLS de produtos continua valendo para o chamador.
-- O filtro explicito por tenant_id e defesa em profundidade, caso a policy
-- de UPDATE seja afrouxada no futuro.

CREATE OR REPLACE FUNCTION public.ajustar_estoque(
  p_produto_id UUID,
  p_delta INT
) RETURNS INT AS $$
DECLARE
  v_novo_estoque INT;
BEGIN
  UPDATE public.produtos
     SET estoque = estoque + p_delta
   WHERE id = p_produto_id
     AND tenant_id = public.current_tenant_id()
     AND estoque + p_delta >= 0
  RETURNING estoque INTO v_novo_estoque;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estoque insuficiente ou produto inacessivel (produto: %, delta: %)',
      p_produto_id, p_delta
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN v_novo_estoque;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.ajustar_estoque(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ajustar_estoque(UUID, INT) TO authenticated;
