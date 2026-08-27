---
name: project-conventions
description: Convenções de código do Allure — estrutura de pastas, acesso a dados, formulários e estado. Carregue antes de criar página, componente ou service novo.
user-invocable: false
---

# Convenções do Allure

SaaS multi-tenant de salão de beleza. React 19 + Vite + Supabase. JavaScript puro, sem TypeScript.

## Estrutura

```
src/pages/<Feature>/       uma pasta por feature, PascalCase
src/components/domain/     componentes ligados a domínio (ModalServico, etc.)
src/services/<x>Service.js acesso a dados, camelCase
src/contexts/              contexto React (AuthContext)
src/hooks/                 hooks reutilizáveis
src/routes/                definição de rotas
```

Uma página nova é uma pasta em `src/pages/`, não um arquivo solto. `RedefinirSenha.jsx` é a exceção legada.

## Dados

- Toda query Supabase vive em `src/services/`. Componente não importa `supabase` direto.
- Cliente compartilhado: `src/services/supabase.js`.
- Server state via TanStack Query (`useQuery`/`useMutation`), não `useState` + `useEffect`.
- Toda tabela tem `tenant_id` e RLS. Ver [[new-migration]].

## Formulários

`react-hook-form` + schema `zod` via `@hookform/resolvers`. Não valide à mão.

## UI

- Tailwind 4 via `@tailwindcss/vite`. Sem arquivos CSS por componente.
- Ícones: `lucide-react`.
- A UI é em português (pt-BR). Nomes de variáveis e funções seguem o domínio em português (`agendamento`, `profissional`, `servico`) — mantenha isso.

## Testes

Playwright. `playwright.config.js` aponta para `./tests`; specs em `e2e/` não rodam com a config atual.
