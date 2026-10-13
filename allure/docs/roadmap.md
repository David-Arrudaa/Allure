# Roadmap Allure — Estado Real

Consolidado após auditoria de negócio + auditoria técnica (code review).
Última atualização: 2026-09-27.

> **Regra adotada daqui em diante:** um item só é marcado CONCLUÍDO depois de
> `npm run build` verde **e** validação de que a UI envia/exibe o dado — não basta
> service e schema estarem corretos.

---

## Legenda

- ✅ **CONCLUÍDO** — banco + service + UI validados
- ⚠️ **PARCIAL** — backend pronto, UI não conecta
- ❌ **NÃO FEITO** — declarado pronto antes, mas código inexistente ou inoperante
- 🔴 **BLOQUEADOR** — impede build/uso

---

## Bloqueadores (corrigir antes de tudo)

| # | Item | Arquivo | Causa |
|---|------|---------|-------|
| B1 | ✅ **CORRIGIDO** | `src/services/transacoesService.js:562-566` | JSDoc de `registrarPagamentoAgendamento` perdeu a abertura `/**` ao inserir `registrarConsumoInterno` acima dele. Linhas `* - Garante...` ficaram órfãs → `Unexpected token`. **Corrigido em 2026-09-27**: `/**` + linha de título restaurados. Validado: `npm run build` ✓ em 599ms, hash `index-A7ZGkGZe.js` |
| B2 | ✅ **CORRIGIDO** | `src/services/clientesService.js:45,60` | `let diasSemVisita = null` declarada dentro do `if (item.appointments...)`, usada no `return` fora do escopo → `ReferenceError` para qualquer cliente com agendamento. **Corrigido em 2026-09-27**: declaração movida para o mesmo nível de `ultimaVisitaStr`, antes do `if`. Cliente sem agendamento agora sai com `diasSemVisita: null` em vez de derrubar a tela. Validado: `npm run build` ✓ em 636ms, hash `index-BRKfxuZX.js`, lint 8 → 7 erros |

### Lição aprendida (padrão recorrente)

**Variável calculada e descartada** apareceu 3× nesta base:
1. `clientesService.js:45` — `diasSemVisita` declarada em escopo interno (B2)
2. `transacoesService.js:221-222` — `comissaoPadraoProduto`/`comissaoPadraoServico` calculados em `atualizarVendaAvulsa` e nunca usados
3. `ModalRecebimentoAvulso` — `comissao_percentual` capturada no carrinho e descartada no payload

**Como evitar:** ao adicionar um campo que atravessa camadas (service → hook → UI → payload), seguir o dado até o destino final antes de declarar pronto. O warning `no-unused-vars` do ESLint detecta os três casos — conferir os warnings, não só os erros.

### Baseline de lint (2026-09-27, pós-B1/B2)

`✖ 27 problems (7 errors, 20 warnings)` — os **7 erros são todos pré-existentes e fora do código ativo do app**:
- 6× `copy_assets.js` (`require`/`__dirname` — script Node fora do preset ES do ESLint)
- 1× `ModalMensagensWhatsapp/index.jsx:139` (`no-useless-assignment`)

**Qualquer erro novo além destes 7 é regressão introduzida.**

> ⚠️ Nota de método: antes da correção de B1, o parser abortava no `Unexpected token` e **ocultava warnings** dos arquivos afetados. Os warnings subiram 17 → 20 após a correção — não é regressão, é visibilidade recuperada. Ao comparar contagens de lint, verificar se houve mudança no estado de parsing.

---

## Fase 1 — Clientes ausentes + WhatsApp

| Item | Status | Detalhe |
|------|--------|---------|
| Cálculo de `diasSemVisita` | ✅ CONCLUÍDO | Corrigido em B2: escopo no mesmo nível de `ultimaVisitaStr`, calcula dias desde o último agendamento concluído |
| Botão WhatsApp com mensagem pré-pronta | ✅ CONCLUÍDO | `Clientes.jsx`, abre `wa.me` com mensagem de reativação |
| Filtro "Ausentes +30/+60 dias" | ✅ CONCLUÍDO | Parâmetro dedicado `filtroInatividade` adicionado em `useClientes.js` e `fetchClientes()`. Desacoplado da busca textual. Filtra `diasSemVisita >= 30` ou `>= 60` |

---

## Fase 2 — Pagamento misto

| Item | Status | Detalhe |
|------|--------|---------|
| Tabela `transacao_pagamentos` + RLS | ✅ CONCLUÍDO | Existe no banco, RLS isola por tenant corretamente |
| UI de múltiplas formas de pagamento | ✅ CONCLUÍDO | `ModalRecebimentoAvulso` agora tem botão "+ Dividir pagamento", lista dinâmica de formas com valor monetário, validação de soma em tempo real contra o total líquido e bloqueio de divergência |
| Gravação dos pagamentos parciais | ✅ CONCLUÍDO | `criarVendaAvulsa` e `atualizarVendaAvulsa` gravam em `transacao_pagamentos` com rollback em cascata se falhar, e salvam rótulo consolidado no header para telas legadas |

---

## Fase 3 — Comanda multiprofissional

| Item | Status | Detalhe |
|------|--------|---------|
| Coluna `transacao_itens.profissional_id` | ✅ CONCLUÍDO | Existe, FK para `profissionais` |
| Backend aceita profissional por item | ✅ CONCLUÍDO | `transacoesService.js` usa `item.profissionalId \|\| profissionalId` no insert e no update |
| Índice na FK | ✅ CONCLUÍDO | Índices criados no banco: `idx_transacao_itens_profissional_id` e `idx_transacao_pagamentos_transacao_id` |
| UI: seletor de profissional por item | ✅ CONCLUÍDO | `ModalRecebimentoAvulso` agora tem `<select>` de profissional em cada item do carrinho e envia `profissionalId` no `itensPayload` |

---

## Fase 4 — Taxa de cartão + Uso interno

| Item | Status | Detalhe |
|------|--------|---------|
| Colunas de taxa em `tenants` | ✅ CONCLUÍDO | `taxa_cartao_debito`, `taxa_cartao_credito`, `descontar_taxa_cartao_comissao` |
| Desconto de taxa na base de comissão | ✅ CONCLUÍDO | Aplicado em `criarVendaAvulsa`, `atualizarVendaAvulsa`, `registrarPagamentoAgendamento`. Usa `tenantConf?.` com fallback `= 0` — degrada bem se vier nulo |
| `registrarConsumoInterno` (service) | ✅ CONCLUÍDO | Cria transação tipo `consumo_interno` valor 0, item, e baixa estoque |
| Hook `registrarConsumo` | ✅ CONCLUÍDO | Exposto em `useProdutos.js` |
| Constraint de tipo em `transacoes` | ✅ CONCLUÍDO | Aceita `consumo_interno` e `ajuste_estoque` |
| Modal de Uso Interno na UI | ✅ CONCLUÍDO | Modal implementado em `Produtos.jsx`: exibe estoque disponível, input com validação de limite, confirmação desabilitada se esgotado e chamada para `registrarConsumo` |
| UI de configuração das taxas | ✅ CONCLUÍDO | Tela de Configurações reativada no menu lateral para administradores; card de Maquininha permite configurar toggle de repasse, taxa de débito (%) e crédito (%) com salvamento direto na tabela `tenants` |

---

## Comissão hierárquica (pré-Fase 4)

| Item | Status | Detalhe |
|------|--------|---------|
| `comissao_servicos`/`comissao_produtos` em Equipe | ✅ CONCLUÍDO | Inputs no formulário, salvam corretamente |
| Override em Serviços e Produtos | ✅ CONCLUÍDO | Campo opcional nos dois modais de cadastro |
| Resolução hierárquica no backend | ✅ CONCLUÍDO | `transacoesService.js:62-65` distingue `0` explícito de `undefined`/`null` — **não** cai no bug de falsy |
| Override chegar ao backend via PDV | ✅ CONCLUÍDO | `ModalRecebimentoAvulso` agora passa `comissao_percentual` de cada item no `itensPayload` para criação e atualização |

---

## Relatórios financeiros — divergência corrigida

| Item | Status | Detalhe |
|------|--------|---------|
| Unificar fonte de comissão | ✅ CONCLUÍDO | `relatoriosService.js` ajustado para trazer `comissao_servicos, comissao_produtos`. `Relatorios.jsx` e `useFinanceiro.js` agora calculam comissão item a item diferenciando produto e serviço com os percentuais reais da equipe, eliminando a distorção e o 50% forçado |

---

## Integridade de estoque

| Item | Status | Detalhe |
|------|--------|---------|
| Validação de estoque insuficiente | ✅ CONCLUÍDO | Validação dupla implementada: no frontend (`ModalRecebimentoAvulso`) ao adicionar/alterar quantidade no carrinho, e no backend (`transacoesService.js:criarVendaAvulsa`) antes de iniciar o insert da venda, impedindo venda de itens esgotados ou com saldo insuficiente |
| Baixa atômica (RPC/`FOR UPDATE`) | ✅ CONCLUÍDO | Conectada a RPC Postgres `ajustar_estoque` em `criarVendaAvulsa`, `atualizarVendaAvulsa` e `registrarConsumoInterno`, garantindo débito/crédito atômico com validação `estoque + delta >= 0` no banco e fallback defensivo |

---

## Funcionalidades fantasma (UI existe, não funciona)

| Item | Status | Detalhe |
|------|--------|---------|
| Agenda pública `/agendar/:tenant_id` | ✅ CONCLUÍDO | Religada ao Supabase: busca serviços e equipe reais do tenant, valida dados da cliente (reusa cadastro ou cria novo) e insere o agendamento em `appointments` como pendente |
| `Pacotes.jsx` | ✅ CONCLUÍDO | Tela de Pacotes religada e roteada em `/pacotes`: adicionada ao menu lateral, lista pacotes reais do banco, permite cadastro com nome, sessões e valor, e exclusão com feedback |
| Configurações → WhatsApp (Evolution API) | ❌ NÃO FEITO | Campos na tela, `onSubmit` vazio. **Causa raiz do gap de lembrete automático** — a tela sugere que está ativo |
| Configurações → Pesquisas de Satisfação | ❌ NÃO FEITO | Card estático, sem coleta |

---

## Gaps de negócio (nunca iniciados)

Priorizados pela ótica de dono de salão:

| # | Gap | Impacto se não resolver |
|---|-----|------------------------|
| G1 | Lembrete automático de agendamento | No-show é a maior fonte de prejuízo de agenda em salão pequeno; hoje 100% manual |
| G2 | Agenda pública funcional | Perde reserva fora do horário comercial; risco reputacional com o mockup no ar |
| G3 | Pacotes/assinaturas recorrentes | Sem receita recorrente previsível nem caixa antecipado |
| G4 | DRE / controle de despesas | Mostra faturamento e comissão, não lucro — preço e contratação no achismo |
| G5 | Política de no-show + contagem de faltas | Falta recorrente normalizada, sem dado para agir |
| G6 | Validade e fornecedor/custo de produto | Perda por vencimento; margem real de revenda desconhecida (sem CMV) |
| G7 | Horário de trabalho, folga, almoço recorrente | "Pausa" é bloqueio manual um a um; risco de overbooking |
| G8 | Fila de espera | Horário vago por cancelamento não é reaproveitado |
| G9 | Meta de vendas por profissional | Sem gestão de performance individual |
| G10 | Alerta de estoque baixo | Ruptura sem aviso |
| G11 | Fidelidade/pontos | Sem alavanca de retenção estruturada |
| G12 | Split de conta entre clientes distintos | Diferente do pagamento misto (múltiplas *formas* ≠ múltiplos *pagadores*) |
| G13 | Múltiplas unidades na mesma conta | Arquitetura multi-tenant existe, mas sem troca de filial nem consolidação de rede |
| G14 | Anamnese/ficha técnica por serviço | Responsabilidade técnica em procedimento químico/estético |
| G15 | Aniversariantes do dia/mês | Oportunidade de contato perdida |

---

## Sólido, sem ressalva

- **Agenda** — módulo mais maduro: recorrência com resolução de conflito em lote, detecção de choque de horário, agendamento retroativo com confirmação, sinalização de agendamentos órfãos quando profissional é desativado, filtro de profissionais memorizado em `localStorage`
- **Segurança RLS** — escalação de privilégio em `profissionais` fechada (INSERT/UPDATE/DELETE exigem admin); coluna `senha` em texto puro removida; isolamento por tenant em todas as 14 tabelas, fail-closed sem JWT
- **XSS** — `escapeHtml` + `opener = null` nos dois relatórios de impressão
- **UX mobile** — `100dvh` em modais, alvos de toque 44px, tecla `Esc`, `inputMode`/`autoComplete`, overlay que não descarta formulário preenchido
- **Integridade de dados** — exclusão de venda avulsa devolve estoque; não deleta admin único nem profissional com histórico

---

## Ordem de execução

**Bloqueadores (independem de decisão):**
1. B1 — JSDoc em `transacoesService.js:562`
2. B2 — escopo de `diasSemVisita` em `clientesService.js`
3. `build` + `lint` com saída real colada

**Decisão pendente:** destino da Fase 2 (implementar UI ou remover tabela órfã)

**Correções do que foi declarado pronto:**
4. Filtro "Ausentes" com parâmetro dedicado
5. Renderizar modal de Uso Interno
6. Seletor de profissional por item + reenviar `profissionalId` e `comissao_percentual` no payload (fecha Fase 3 e o override de comissão)
7. Unificar relatórios em `transacao_itens.valor_comissao`
8. Checagem de estoque insuficiente + RPC transacional
9. Índices nas 2 FKs novas
10. UI de configuração das taxas de cartão

**Religar o que está pela metade:**
11. Configurações → WhatsApp (destrava G1)
12. Agenda pública (G2)
13. Pacotes (G3)

**Novo desenvolvimento:** G4 em diante
