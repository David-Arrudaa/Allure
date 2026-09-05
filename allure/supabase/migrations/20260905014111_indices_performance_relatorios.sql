-- Índices de performance para consultas de agenda, financeiro e a futura aba de relatórios.
-- Elimina Seq Scan em appointments/customers (confirmado via EXPLAIN ANALYZE) e cobre os
-- filtros mais usados: isolamento por tenant, período de data, profissional, pagamento e status.

-- appointments: tenant + data (agenda do dia, relatórios por período)
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_data
  ON public.appointments (tenant_id, data_horario DESC);

-- appointments: cobre a query de financeiro/relatórios (período + pagamento + status)
-- sem precisar visitar a tabela para os campos usados na listagem/soma
CREATE INDEX IF NOT EXISTS idx_appointments_financeiro_relatorios
  ON public.appointments (tenant_id, data_horario, pagamento, status)
  INCLUDE (valor, forma_pagamento, profissional_id, customer_id);

-- appointments: relatório/filtro por profissional dentro de um período
CREATE INDEX IF NOT EXISTS idx_appointments_profissional
  ON public.appointments (tenant_id, profissional_id, data_horario);

-- appointments: já existe FK para customers sem índice de cobertura (advisor: unindexed_foreign_keys)
CREATE INDEX IF NOT EXISTS idx_appointments_customer
  ON public.appointments (customer_id);

-- customers: isolamento por tenant + busca por nome (usada em /clientes e no financeiro)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_nome
  ON public.customers (tenant_id, nome text_pattern_ops);

-- profissionais: isolamento por tenant + ordem de exibição (usado em /agenda, /equipe, /financeiro)
CREATE INDEX IF NOT EXISTS idx_profissionais_tenant_ordem
  ON public.profissionais (tenant_id, ordem);

-- servicos: isolamento por tenant + busca por nome (usada em /servicos)
CREATE INDEX IF NOT EXISTS idx_servicos_tenant_nome
  ON public.servicos (tenant_id, nome);
