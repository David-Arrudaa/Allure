# Requisitos — Allure

Levantamento consolidado a partir da inspeção do código e do banco. Origem: documentos de análise produzidos durante a fase Antigravity (agosto/2026), revalidados contra o código e o banco em 27/08/2026.

## Visão geral

SaaS multi-tenant para salões de beleza, clínicas de estética e barbearias. Módulos: Agenda, Clientes, Equipe, Serviços, Produtos, Financeiro, Configurações.

## Requisitos funcionais

### Agenda e atendimento
- **RF-01** — Exibir agenda diária em grade de horários.
- **RF-02** — Criar, editar e excluir agendamentos via modais na agenda.
- **RF-03** — Marcar recorrência (semanal, quinzenal) e gerir/excluir séries.
- **RF-04** — Registrar e controlar pagamentos direto pela Agenda (`ModalPagamento`).
- **RF-05** — Busca combinada de cliente por nome **ou** telefone no agendamento (cláusula `.or()`).
- **RF-06** — Status semânticos no card: Pendente, Confirmado, Pago, Cancelado.
- **RF-07** — Templates dinâmicos de WhatsApp por contexto (Lembrete, Cobrança).

### Clientes
- **RF-08** — Cadastro com nome, telefone, flag WhatsApp e observações.
- **RF-09** — Busca por nome a partir de 3 caracteres.
- **RF-10** — Última visita calculada do histórico de agendamentos passados não cancelados.
- **RF-11** — Histórico completo de agendamentos por cliente.
- **RF-12** — Edição, exclusão e paginação (25 por página).

### Equipe e controle de acesso
- **RF-13** — Cadastro de profissionais.
- **RF-14** — Autenticação via Supabase GoTrue (e-mail e senha).
- **RF-15** — Isolamento multi-tenant por RLS sobre `tenant_id`.
- **RF-16** — RBAC: admin vê tudo do tenant; funcionário vê apenas os próprios registros no Financeiro. Ver lacuna **L-03**.

### Produtos e serviços
- **RF-17** — Catálogo de produtos (nome, preço, estoque), CRUD completo.
- **RF-18** — Catálogo de serviços (nome, preço), CRUD completo.

### Financeiro
- **RF-19** — Histórico de pagamentos filtrável por mês e ano.
- **RF-20** — Métricas consolidadas do período.
- **RF-21** — Lançamento de recebimento avulso, sem vínculo com a agenda.
- **RF-22** — Desempenho por profissional (filtro mês/semana).

### Dashboard
- **RF-23** — Indicadores: faturamento, nº de agendamentos, ticket médio, pendências.
- **RF-24** — Filtro por período pré-definido ou customizado.
- **RF-25** — Ranking de profissionais e de serviços.
- **RF-26** — Lista de pagamentos pendentes com acesso rápido via modal.

## Requisitos não funcionais

- **RNF-01** — Interface responsiva (mobile, tablet, desktop) com Tailwind.
- **RNF-02** — Isolamento estrito entre tenants via RLS baseado em `tenant_id`.
- **RNF-03** — Autenticação por provedor gerenciado (Supabase GoTrue).
- **RNF-04** — Listagens paginadas no banco, com contagem total.
- **RNF-05** — Validação de formulários com `zod` + `react-hook-form`.
- **RNF-06** — Server state via TanStack Query (cache, loading, retry).
- **RNF-07** — Cobertura E2E dos fluxos críticos com Playwright.

## Lacunas conhecidas (verificadas em 27/08/2026)

Estas são divergências entre o que os relatórios da fase Antigravity afirmavam e o estado real. Confirmadas contra o código e o banco.

- **L-01 — 6 tabelas com RLS ativo e nenhuma policy.** `financeiro`, `pacotes`, `cliente_pacotes`, `avaliacoes`, `integracoes_whatsapp`, `whatsapp_templates` estão em *default deny*: RLS habilitado sem policy nenhuma bloqueia toda query do app. As 6 tabelas com policy (`appointments`, `customers`, `produtos`, `profissionais`, `servicos`, `tenants`) usam `FOR ALL` com `USING` + `WITH CHECK` e estão corretas.
- **L-02 — `Pacotes.jsx` e `Dashboard.jsx` existem mas não têm rota** em `src/routes/index.jsx`, portanto são inalcançáveis. O menu lateral aponta "Painel" para `/`, que redireciona para `/login`.
- **L-03 — RBAC por `is_admin` não está nas policies.** A policy de `appointments` faz apenas isolamento por tenant. A restrição "funcionário vê só as próprias vendas" existe só no roteamento (`AdminRoute` em `/produtos` e `/equipe`), ou seja, no cliente — não no banco.
- **L-04 — Campos monetários sem máscara.** `ModalServico`, `ModalAgendamento`, `ModalRecebimentoAvulso` e `ModalPagamento` aceitam string livre no campo de valor, com validação frouxa (`replace(",", ".")`). Não impedem caracteres inválidos.
- **L-05 — Migração para Tailwind incompleta.** 17 arquivos `.css` por componente ainda existem em `src/`, apesar de o Tailwind 4 estar instalado e em uso.
- **L-06 — Fluxo público sem escopo de tenant verificado.** `/agendar/:tenant_id` não tem JWT, logo `current_tenant_id()` retorna NULL e toda policy nega. Como esse caminho obtém acesso, e se o escopo está limitado ao tenant do link, precisa ser auditado.
