# Roadmap / Backlog — Allure

Consolidado de `system_evolution.md`, `action_plan_gabriela.md` e da comparação com concorrentes (Trinks/Vezz) produzida na fase Antigravity. Prioridade sugerida por risco, não por esforço.

## P0 — Bloqueadores (banco em default-deny ou inseguro)

- Criar policies para `financeiro`, `pacotes`, `cliente_pacotes`, `avaliacoes`, `integracoes_whatsapp`, `whatsapp_templates` (L-01 em `docs/REQUISITOS.md`). Sem isso os módulos correspondentes não funcionam, independente do código de UI.
- Mover RBAC (`is_admin`) para dentro das policies de `financeiro`/`appointments` em vez de só no `AdminRoute` do cliente (L-03).
- Auditar `/agendar/:tenant_id`: confirmar que o escopo de tenant é reforçado em algum lugar (policy dedicada para `anon`, ou checagem no service) e não apenas confiado ao parâmetro de rota (L-06).

## P1 — Funcional, já existe mas quebrado ou incompleto

- Adicionar rotas para `Pacotes.jsx` e `Dashboard.jsx` em `src/routes/index.jsx`, ou removê-los se forem obsoletos (L-02).
- Máscara de moeda nos campos de valor: `ModalServico`, `ModalAgendamento`, `ModalRecebimentoAvulso`, `ModalPagamento` (L-04).
- Terminar a migração para Tailwind: eliminar os 17 arquivos `.css` restantes por componente (L-05).

## P2 — Demandas da Gabriela (dono do produto, levantadas na Fase 2)

- Logs de auditoria (quem alterou o quê, quando).
- PDV simplificado para venda de produto avulso sem passar pela Agenda.
- Folha de impressão (print stylesheet) para comprovante de atendimento.
- Busca dupla (nome + telefone) em mais telas além do agendamento.
- Templates de WhatsApp configuráveis por tenant (a tabela `whatsapp_templates` já existe, mas está bloqueada por RLS — depende do P0).

## P3 — Gaps competitivos (vs. Trinks/Vezz, não confirmados como prioridade do cliente)

- Pacote de sessões pré-pagas com abatimento automático (`pacotes` + `cliente_pacotes` — mesma dependência do P0).
- Avaliação pós-atendimento (tabela `avaliacoes` já existe, mesma dependência).
- Integração nativa de WhatsApp (hoje é só link `wa.me`, tabela `integracoes_whatsapp` sem uso real).

## Fora de escopo por ora

Itens do `implementation_plan.md`/`walkthrough.md` da fase Antigravity que eram passos de implementação já concluídos ou específicos daquela sessão de trabalho (não requisitos de produto) — não reproduzidos aqui.
