# Uso de usuários — base de conhecimento (logs Supabase)

> Gerado a partir dos logs nativos do Supabase (ClickHouse `query_logs`). Projeto `ljrvtmhrwrkuomkzecqr`. Somente leitura, sem alterações de schema.

## Janela analisada

`2026-09-26T17:49:08Z` → `2026-09-27T17:49:08Z` (24h corridas — janela máxima permitida pela API de logs).

**Aviso de representatividade:** volume muito baixo (90 requests HTTP no total, ~4 contas de usuário distintas). Isso é uma amostra de teste/uso inicial, não um padrão estatístico de "como os usuários do salão usam o app". Trate os números abaixo como um retrato pontual, não uma tendência.

## Método (para repetir depois)

Fontes disponíveis no projeto (`select distinct source from logs`): `edge_logs`, `postgres_logs`, `auth_logs`, `auth_audit_logs`. **`function_edge_logs` não existe** — o projeto não tem Edge Functions implantadas/invocadas nesta janela.

Queries usadas (via MCP `query_logs`, sempre passando `iso_timestamp_start`/`iso_timestamp_end` explícitos, janela máx. 24h):

```sql
-- volume por hora
select toStartOfHour(timestamp) as hour, count(*) as n
from logs where source='edge_logs' group by hour order by hour;

-- endpoints mais acessados
select log_attributes['request.method'] as method,
       log_attributes['request.path'] as path, count(*) as n
from logs where source='edge_logs' group by method, path order by n desc;

-- status codes
select log_attributes['response.status_code'] as status, count(*) as n
from logs where source='edge_logs' group by status order by n desc;

-- erros (4xx/5xx)
select event_message, log_attributes['request.method'] as method,
       log_attributes['request.path'] as path,
       log_attributes['response.status_code'] as status, timestamp
from logs where source='edge_logs'
  and toInt32OrZero(log_attributes['response.status_code']) >= 400
order by timestamp desc;

-- user agents
select log_attributes['request.headers.user_agent'] as ua, count(*) as n
from logs where source='edge_logs' group by ua order by n desc;

-- erros/severidade em postgres_logs
select log_attributes['parsed.error_severity'] as sev, count(*) as n
from logs where source='postgres_logs' group by sev order by n desc;

-- eventos de auth (login/signup/logout/erros)
select timestamp, event_message from logs where source='auth_logs' order by timestamp desc;
```

## Métricas observadas (DADO — medido nos logs)

### Volume de requests HTTP (edge_logs, total = 90)

| Hora (UTC) | Hora (BRT, UTC-3) | Requests |
|---|---|---|
| 22:00 (dia anterior) | 19h | 5 |
| 00:00 | 21h | 9 |
| 04:00 | 01h | 53 |
| 13:00 | 10h | 23 |

Pico às 04h UTC / **01h da manhã em BRT** (53 de 90 requests = 59% do tráfego). Isso **não bate com horário comercial de salão**. Ver hipótese abaixo.

### Endpoints mais acessados (edge_logs)

| Método | Path | Requests |
|---|---|---|
| GET | `/rest/v1/profissionais` | 30 |
| GET | `/rest/v1/appointments` | 25 |
| GET | `/rest/v1/customers` | 11 |
| HEAD | `/rest/v1/customers` | 8 |
| POST | `/auth/v1/token` | 7 |
| GET | `/rest/v1/servicos` | 2 |
| POST | `/auth/v1/signup` | 2 |
| POST/PATCH | `/rest/v1/appointments` | 2 |
| POST | `/rest/v1/profissionais` | 1 |
| PATCH | `/rest/v1/customers` | 1 |
| POST | `/auth/v1/logout` | 1 |

Não há chamadas a uma API própria (Next.js API routes) nos edge_logs — o app fala direto com PostgREST (`supabase-js`) do navegador. Tabelas mais lidas: `profissionais` e `appointments` (agenda), consistente com tela de agenda sendo a mais usada.

### Taxa de erro / status codes

| Status | Requests | % |
|---|---|---|
| 200 | 84 | 93,3% |
| 204 | 3 | 3,3% |
| 201 | 2 | 2,2% |
| 422 | 1 | 1,1% |

**Único erro HTTP na janela:** `POST /auth/v1/signup` → 422, `"error":"422: User already registered"` (código `user_already_exists`), usuário `alan.nicolas@outlook.com` às 04:35 UTC. Confirmado também em `auth_logs`/`auth_audit_logs` como `user_repeated_signup`.

- **Taxa de erro geral: 1,1%** (1/90) — baixa, mas amostra pequena demais para conclusão robusta.
- `postgres_logs` (17 linhas): 100% severidade `LOG` (mensagens internas do checkpointer do Postgres). **Zero erros, zero RLS/permission denied, zero timeouts** nesta janela.
- Não há dado de query lenta: o log de statement do Postgres (duração de query) não está habilitado por padrão neste projeto — não é possível medir latência de query pelos logs sem ativar `log_min_duration_statement`.
- `function_edge_logs`: fonte inexistente — sem Edge Functions em uso, logo sem erros dessa camada a reportar.

### Usuários / sessões vistas (auth_logs + auth_audit_logs, 18 + 15 eventos)

4 contas distintas tiveram atividade de auth na janela:

| user_id (parcial) | e-mail | Ações |
|---|---|---|
| `0969a24b…` | tamiriscosta172@gmail.com | login (password) + token refresh, 13:01 UTC |
| `96fdde7d…` | teste@email.com | signup + login imediato, 04:35 UTC (nome sugere conta de teste) |
| `00cb53fa…` | alan.nicolas@outlook.com | login → logout → login → **signup duplicado (422)**, 04:34–04:35 UTC (nome sugere dev) |
| `ae046fec…` | anajulia300715@gmail.com | token refresh, 22:54 UTC |

**Sinal importante:** os eventos de `alan.nicolas@outlook.com` e `teste@email.com` têm `referer: http://localhost:3000` (ambiente de desenvolvimento local), enquanto os requests de `edge_logs` mostram `referer: https://luzz-gestao.vercel.app/` (produção). **A amostra mistura tráfego de dev/teste com tráfego real** — não dá para separar com certeza qual fração é uso real de cliente do salão vs. o próprio time testando.

### Plataforma / dispositivo (User-Agent, edge_logs)

| User-Agent | Requests | % |
|---|---|---|
| iPhone, iOS 18.7, Safari (build 26.6.1) | 85 | 94,4% |
| iPhone, iOS 18.7, Safari (build 26.6) | 5 | 5,6% |

**100% do tráfego é iPhone/Safari mobile.** Zero Android, zero desktop, zero outro navegador nesta janela. Provavelmente são 1–2 dispositivos físicos (dev testando pelo celular), não uma amostra de usuários reais variados — não deve ser generalizado como "o app é usado majoritariamente no iPhone" sem mais dados.

## Hipóteses (NÃO são dado direto — inferência sobre o dado)

- **HIPÓTESE:** o pico às 01h BRT é sessão de desenvolvimento/QA (commits recentes do dia mostram fixes ativos: agenda, PDV, financeiro), não uso real de cliente de salão de madrugada.
- **HIPÓTESE:** `teste@email.com` e `alan.nicolas@outlook.com` são contas internas (dev/QA), não clientes reais — reduz ainda mais a amostra de "uso real" possivelmente para 2 contas (`tamiriscosta172…`, `anajulia300715…`).
- **HIPÓTESE:** a tela de Agenda (`appointments`/`profissionais`) é a mais usada, dado o volume de GET nessas tabelas — mas sem saber se é 1 usuário recarregando a tela várias vezes ou vários usuários únicos acessando uma vez.
- **HIPÓTESE:** o erro 422 de cadastro duplicado é fricção real de UX (usuário tentando se cadastrar de novo, possivelmente por não lembrar que já tinha conta, ou por não ter fluxo de "esqueci senha" visível) — mas é 1 ocorrência, não dá para afirmar que é um padrão recorrente.

## Lacunas de dados — o que os logs do Supabase NÃO respondem

Os logs são server-side (requisições HTTP/SQL/auth). Eles **não contam nada sobre comportamento dentro da tela**:

- Onde o usuário clica, em que ordem, quanto tempo fica em cada tela.
- Em que campo de formulário ele desiste (abandono de formulário).
- Quantos toques/telas até completar uma ação (ex.: criar agendamento).
- Se o app "parece lento" para o usuário (edge_logs tem `response.origin_time`, mas isso é o servidor, não percepção do usuário/rede móvel/renderização do front).
- Se um erro de front-end (JS exception, estado inconsistente) aconteceu sem gerar request de erro no backend.
- Fluxo completo de navegação (funil: login → agenda → novo agendamento → salvar, etc.) — os logs mostram requests soltos, não a sequência de tela.
- Distinguir cliente real de teste interno com certeza (só dá pra inferir por referer/e-mail, como acima).

## Plano mínimo de instrumentação recomendado

Uma opção só, sem overengineering (a base de usuários é pequena hoje — ferramenta de analytics de terceiros como PostHog/Amplitude é overkill agora):

**Tabela `eventos_uso` (append-only) + RLS.**

```sql
create table eventos_uso (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) default auth.uid(),
  tenant_id uuid,
  evento text not null,        -- ex: 'agenda_view', 'agendamento_criado', 'form_abandonado'
  contexto jsonb,               -- payload livre (tela, campo, etc.)
  criado_em timestamptz not null default now()
);

alter table eventos_uso enable row level security;

create policy "insert proprio evento"
  on eventos_uso for insert
  with check (auth.uid() = user_id);

-- sem policy de select para usuário comum: leitura só via service_role/dashboard
```

Client-side: 1 função helper (`registrarEvento(evento, contexto)`) chamando `supabase.from('eventos_uso').insert(...)`, chamada nos pontos que já importam de verdade (abrir tela de agenda, salvar agendamento, erro de submit de formulário, abandono — `beforeunload`/blur em formulário longo). ~15 linhas de código total, zero dependência nova.

Isso cobre exatamente as lacunas acima (funil, abandono, eventos de erro de front) sem adicionar um serviço externo, dashboard novo, ou SDK de analytics. Se o volume de usuários crescer muito (centenas/dia) e a necessidade virar "funis visuais, coortes, replay de sessão", aí sim vale reavaliar uma ferramenta dedicada — não antes.

---

*Gerado em 2026-09-27 a partir de logs Supabase (24h). Reexecutar as queries da seção "Método" para atualizar com janela mais recente/maior amostra antes de tomar decisões de produto.*
