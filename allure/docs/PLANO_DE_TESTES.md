# Plano de Testes — Allure

Consolidado dos planos produzidos na fase Antigravity, revisado para a estrutura real do projeto: **Playwright, único runner, specs em `tests/`** (ver `CLAUDE.md` sobre o mismatch histórico com `e2e/`, já removida).

## Ferramentas

- **E2E**: Playwright (já em uso, `@playwright/test`).
- **Unitário/Componente**: não configurado. Se necessário no futuro, Vitest + React Testing Library (Vite já monta a base).
- **Visual/regressão**: não configurado, sem necessidade identificada no momento.

## Cenários cobertos hoje (`tests/`)

- `tests/clientes.spec.js` — CRUD de clientes com mock de rede (`**/rest/v1/customers*`): listar, criar, editar, excluir.
- `tests/agenda-qa.spec.js` — carregamento da Agenda, navegação de dias, abertura do modal de novo agendamento, filtro de profissionais.

## Cenários pendentes de automação

Extraído dos planos de QA anteriores, filtrado para o que ainda é aplicável ao código atual.

### Multi-tenant e RLS
- **TC-01 — Isolamento entre tenants**: logado no tenant A, tentar acessar/mutar registro do tenant B via `src/services/*Service.js`. Esperado: array vazio ou erro de RLS, nunca dado do outro tenant. Ver `rls-reviewer` subagent para a checklist de policy.
- **TC-02 — Tabelas com RLS sem policy**: `financeiro`, `pacotes`, `cliente_pacotes`, `avaliacoes`, `integracoes_whatsapp`, `whatsapp_templates` devem ganhar policy antes de qualquer teste funcional nelas — hoje toda query é bloqueada (ver `docs/REQUISITOS.md`, L-01).
- **TC-03 — Fluxo público (`/agendar/:tenant_id`)**: usuário anônimo consegue agendar dentro do escopo do tenant do link, mas não acessa nenhuma rota privada nem dado de outro tenant.

### Autenticação
- **TC-04 — Login**: credenciais válidas redirecionam para `/agenda`; inválidas mostram erro e mantêm a tela.
- **TC-05 — Sessão expirada/logout**: `AuthContext` deve limpar `user` e redirecionar para `/login` (não usar mock fixo — ver histórico de regressão abaixo).

### Clientes
- Cobertos por `tests/clientes.spec.js`. Adicionar: busca por nome com debounce, paginação além da primeira página.

### Agenda
- Cobertos parcialmente por `tests/agenda-qa.spec.js`. Adicionar: criação real de agendamento com submit completo (cliente + serviço + data + hora), alteração de status do card, recebimento de pagamento, exclusão de série recorrente.

### Financeiro e Dashboard
- Sem cobertura E2E. Adicionar após TC-02 ser resolvido (RLS bloqueia hoje).

### Responsividade
- Menu lateral vira hambúrguer em mobile; grade da Agenda se adapta em tablet/desktop. Sem automação — validar manualmente ou com `page.setViewportSize` no Playwright se for automatizar.

## Como rodar

```bash
npx playwright test                          # tudo em tests/
npx playwright test tests/clientes.spec.js   # um arquivo
npx playwright test -g "nome do teste"       # um teste
```

## Regressão conhecida (já corrigida)

`src/contexts/AuthContext.jsx` chegou a ter um mock hardcoded (usuário fake sempre logado como admin) deixado por uma sessão de testes anterior — desligava a autenticação real em todos os caminhos de erro/logout. Revertido em 27/08/2026. Qualquer novo teste que precise de sessão deve mockar via `page.route` na chamada ao Supabase Auth (ver exemplos em `tests/clientes.spec.js` e `tests/agenda-qa.spec.js`), nunca alterando `AuthContext.jsx` para hardcode.
