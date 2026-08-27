# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Allure is a multi-tenant SaaS for salon/spa/barbershop management. React 19 + Vite + Supabase (Postgres, RLS, GoTrue auth). Plain JavaScript, no TypeScript. UI and domain naming are in Portuguese (pt-BR) — keep new code consistent with that (`agendamento`, `profissional`, `servico`).

## Commands

```bash
npm run dev      # vite dev server, http://localhost:5173
npm run build
npm run lint      # eslint .
npx playwright test                    # run all e2e tests
npx playwright test tests/clientes.spec.js   # single file
npx playwright test -g "nome do teste"       # single test by title
```

**Windows/PowerShell caveat**: script execution policy blocks npm directly in PowerShell. Run via `cmd.exe` with the Node bin on PATH, e.g.:
```bash
cmd.exe /c "set PATH=C:\Users\alann\AppData\Local\nvm\v24.19.0;%PATH% && npm run dev"
```

**Test location mismatch**: `playwright.config.js` sets `testDir: './tests'`. Specs under `tests/` run; specs under `e2e/` do not get picked up by `npx playwright test` unless you pass the path explicitly or point `--config` elsewhere.

## Architecture

- **Routing** (`src/routes/index.jsx`): one `PrivateRoute` wraps all authenticated pages inside a shared `Layout`. `AdminRoute` (defined inline in `index.jsx`) additionally gates `/produtos` and `/equipe` on `user.is_admin`. `/agendar/:tenant_id` is the only unauthenticated route — the public booking flow, keyed by tenant id in the URL rather than a session.
- **Auth** (`src/contexts/AuthContext.jsx`): Supabase GoTrue session, exposes `user`/`loading` consumed by `PrivateRoute` and `AdminRoute`.
- **Multi-tenancy**: every tenant-owned table has a `tenant_id UUID` column and RLS enabled. `current_tenant_id()` (SQL, `SECURITY DEFINER`, defined in `supabase/migrations/001_rls_setup.sql`) resolves the tenant from the JWT by matching `profissionais.email` against `request.jwt.claims`. Policies gate on `tenant_id = current_tenant_id()`. The public booking flow has no JWT, so `current_tenant_id()` returns NULL there — that path's tenant scoping has to come from the `:tenant_id` route param, not RLS alone.
- **Data access**: all Supabase queries live in `src/services/*Service.js` (e.g. `agendaService.js`, `clientesService.js`, `tenantService.js`) via the shared client in `src/services/supabase.js`. Components never import `supabase` directly. Server state is managed with TanStack Query (`useQuery`/`useMutation`), not manual `useState`/`useEffect` fetching.
- **New migrations**: filename is `<YYYYMMDDHHMMSS>_<slug>.sql` in `supabase/migrations/` (UTC timestamp — `date -u +%Y%m%d%H%M%S`). `001_rls_setup.sql` is a legacy naming exception, not the pattern to follow. Never edit a migration that's already been applied — add a new one instead. New tables need `tenant_id`, `ENABLE ROW LEVEL SECURITY`, a policy with both `USING` and `WITH CHECK` (USING alone doesn't block inserting rows under another tenant's id), and an index on `tenant_id`.
- **Forms**: `react-hook-form` + `zod` schemas via `@hookform/resolvers`. Don't hand-roll validation.
- **Styling**: Tailwind 4 via `@tailwindcss/vite`, no per-component CSS files. Icons from `lucide-react`.
- **Folder convention**: one folder per page under `src/pages/<Feature>/` (PascalCase); `RedefinirSenha.jsx` is a legacy loose-file exception. Domain-specific components live in `src/components/domain/`.

## Available subagents/skills in this repo

- `rls-reviewer` subagent — checks tenant isolation (RLS coverage, `WITH CHECK`, `SECURITY DEFINER` functions, anon vs service_role key usage) on new/changed tables and services. Run it after writing a migration.
- `new-migration` skill — walks through the migration boilerplate above.
