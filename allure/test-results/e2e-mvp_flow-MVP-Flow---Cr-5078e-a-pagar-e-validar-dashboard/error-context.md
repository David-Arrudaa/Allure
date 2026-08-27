# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\mvp_flow.spec.js >> MVP Flow - Critical Path >> Deve cadastrar, alterar cliente, marcar agenda, pagar e validar dashboard
- Location: e2e\mvp_flow.spec.js:22:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/agenda
Call log:
  - navigating to "http://localhost:5173/agenda", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MVP Flow - Critical Path', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Injeta a sessão no localStorage para burlar o Captcha do Supabase
  7  |     await page.addInitScript(() => {
  8  |       window.localStorage.setItem(
  9  |         '@Allure:profissional',
  10 |         JSON.stringify({
  11 |           id: 'test-admin-id',
  12 |           nome: 'Admin Teste',
  13 |           email: 'admin@allure.com',
  14 |           tenant_id: 'test-tenant',
  15 |           is_admin: true
  16 |         })
  17 |       );
  18 |     });
> 19 |     await page.goto('/agenda');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/agenda
  20 |   });
  21 | 
  22 |   test('Deve cadastrar, alterar cliente, marcar agenda, pagar e validar dashboard', async ({ page }) => {
  23 | 
  24 |     // 1. Cadastrar cliente
  25 |     await test.step('Cadastrar cliente', async () => {
  26 |       await page.click('text="Clientes"');
  27 |       await page.click('text="Novo Cliente"');
  28 |       await page.fill('input[name="name"]', 'Cliente E2E Test');
  29 |       await page.fill('input[name="phone"]', '11999999999');
  30 |       await page.click('button:has-text("Salvar")');
  31 |       await expect(page.locator('text="Cliente E2E Test"')).toBeVisible();
  32 |     });
  33 | 
  34 |     // 2. Alterar cliente
  35 |     await test.step('Alterar cliente', async () => {
  36 |       await page.click('text="Cliente E2E Test"');
  37 |       await page.click('text="Editar"');
  38 |       await page.fill('input[name="name"]', 'Cliente E2E Alterado');
  39 |       await page.click('button:has-text("Salvar")');
  40 |       await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
  41 |     });
  42 | 
  43 |     // 3. Marcar na agenda
  44 |     await test.step('Marcar na agenda', async () => {
  45 |       await page.click('text="Agenda"');
  46 |       await page.click('text="Novo Agendamento"');
  47 |       await page.selectOption('select[name="clientId"]', { label: 'Cliente E2E Alterado' });
  48 |       await page.fill('input[name="date"]', '2026-10-10');
  49 |       await page.fill('input[name="time"]', '14:00');
  50 |       await page.click('button:has-text("Agendar")');
  51 |       await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
  52 |     });
  53 | 
  54 |     // 4. Simular recebimento (pagamento do atendimento)
  55 |     await test.step('Simular recebimento', async () => {
  56 |       // Find the appointment card and click to pay/receive
  57 |       await page.click('text="Cliente E2E Alterado"'); // opens details or card
  58 |       await page.click('button:has-text("Receber Pagamento")');
  59 |       await page.selectOption('select[name="paymentMethod"]', 'Pix');
  60 |       await page.click('button:has-text("Confirmar Recebimento")');
  61 |       await expect(page.locator('text="Pago"')).toBeVisible();
  62 |     });
  63 | 
  64 |     // 5. Acessar o Dashboard e ver o relatório mensal
  65 |     await test.step('Acessar Dashboard e validar relatório', async () => {
  66 |       await page.click('text="Dashboard"');
  67 | 
  68 |       // Select monthly filter
  69 |       await page.selectOption('select[name="periodFilter"]', 'Mês');
  70 | 
  71 |       // Verify metrics are displayed
  72 |       await expect(page.locator('text="Total de Atendimentos"')).toBeVisible();
  73 |       await expect(page.locator('text="Faturamento"')).toBeVisible();
  74 |       await expect(page.locator('text="Ticket Médio"')).toBeVisible();
  75 | 
  76 |       // Ensure the newly created payment is somewhat reflected or at least no errors
  77 |       // specific value checks depend on mocking/seed data, so we check for presence
  78 |       const faturamentoValue = page.locator('.faturamento-valor');
  79 |       await expect(faturamentoValue).not.toBeEmpty();
  80 |     });
  81 |   });
  82 | });
  83 | 
```