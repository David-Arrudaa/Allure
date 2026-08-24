# Allure - SaaS Multi-tenant de Beleza e Bem-estar

Allure é um SaaS (Software as a Service) multi-tenant focado no gerenciamento de salões de beleza, clínicas de estética e barbearias. O sistema é desenvolvido utilizando React, Vite e Supabase.

## Arquitetura e Tecnologias

- **Front-end:** React 19, Vite, TailwindCSS (v4), React Query, React Hook Form, Zod.
- **Back-end & Banco de Dados:** Supabase (PostgreSQL) com Row Level Security (RLS) para isolamento multi-tenant (função `current_tenant_id()`).
- **Autenticação:** Supabase GoTrue (Email e Senha).
- **Testes (E2E):** Playwright.

## Requisitos

- Node.js (Recomendado v20 ou superior)
- NVM (Node Version Manager) instalado no sistema

## Como Rodar Localmente

**Atenção para usuários de Windows (PowerShell):** Devido a políticas de execução restritas de scripts no PowerShell, recomenda-se iniciar o servidor Vite ou instalar pacotes invocando o `cmd.exe` e setando o PATH para o binário do Node.

### Passo 1: Instalação de Dependências
Abra o seu terminal na pasta do projeto e rode:
```bash
cmd.exe /c "set PATH=C:\Users\alann\AppData\Local\nvm\v24.19.0;%PATH% && npm install"
```

### Passo 2: Executar o Servidor de Desenvolvimento
Para iniciar o projeto localmente com Hot Module Replacement (HMR), rode:
```bash
cmd.exe /c "set PATH=C:\Users\alann\AppData\Local\nvm\v24.19.0;%PATH% && npm run dev"
```

O servidor abrirá por padrão em `http://localhost:5173`.

## Estrutura Principal

- `/src/pages`: Componentes de páginas principais (ex: Clientes, Agenda, Servicos).
- `/src/components/ui`: Componentes de UI genéricos (Button, Input, Skeleton).
- `/src/components/domain`: Componentes e Modais específicos de domínio de negócio.
- `/src/services`: Abstração de chamadas para o banco de dados via cliente Supabase.
- `/src/hooks`: Custom hooks (geralmente wrappers do React Query).
- `/supabase/migrations`: Scripts de definição de RLS e esquemas do banco.
