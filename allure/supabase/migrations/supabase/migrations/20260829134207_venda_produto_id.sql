-- Vincula vendas ao produto por FK, substituindo o parse do texto de `servico`.
-- Motivação: a devolução de estoque dependia de casar `produtos.nome` contra o
-- texto "Venda: <nome> (<n>x)" — frágil a renomeação de produto e a nomes
-- semelhantes, falhando em silêncio.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantidade INT;

-- Vendas históricas ficam NULL se o backfill não casar; o app mantém o parse
-- como fallback nesse caso.
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_quantidade_positiva;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_quantidade_positiva
  CHECK (quantidade IS NULL OR quantidade > 0);

-- Parcial: a maioria dos appointments é atendimento, não venda.
CREATE INDEX IF NOT EXISTS idx_appointments_produto_id
  ON public.appointments (produto_id)
  WHERE produto_id IS NOT NULL;

-- Backfill best-effort das vendas já gravadas.
-- Regex tolera parênteses no nome do produto: em "Venda: Shampoo (500ml) (2x)"
-- o grupo 1 resolve para "Shampoo (500ml)" e a quantidade para 2.
UPDATE public.appointments a
SET
  produto_id  = p.id,
  quantidade  = COALESCE(
    NULLIF(
      regexp_replace(a.servico, '^Venda:\s*.*?\s*\((\d+)x\)$', '\1', 'i'),
      a.servico
    )::INT,
    1
  )
FROM public.produtos p
WHERE a.produto_id IS NULL
  AND a.servico ILIKE 'Venda:%'
  AND a.tenant_id = p.tenant_id
  AND lower(p.nome) = lower(
        trim(regexp_replace(a.servico, '^Venda:\s*(.*?)(?:\s*\(\d+x\))?$', '\1', 'i'))
      );
