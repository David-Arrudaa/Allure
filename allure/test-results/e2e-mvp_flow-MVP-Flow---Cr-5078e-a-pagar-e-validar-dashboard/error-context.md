# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\mvp_flow.spec.js >> MVP Flow - Critical Path >> Deve cadastrar, alterar cliente, marcar agenda, pagar e validar dashboard
- Location: e2e\mvp_flow.spec.js:15:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text="Clientes"')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - img "Logo Allure" [ref=e7]
    - paragraph [ref=e8]: Gestão Inteligente
  - generic [ref=e10]:
    - heading "Bem-vindo(a)" [level=2] [ref=e11]
    - paragraph [ref=e12]: Acesse sua plataforma de gestão.
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]: E-mail
        - textbox "E-mail" [ref=e16]:
          - /placeholder: contato@salao.com
      - generic [ref=e17]:
        - generic [ref=e18]: Senha
        - textbox "Senha" [ref=e19]:
          - /placeholder: ••••••••
      - button "Entrar na plataforma" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MVP Flow - Critical Path', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Assuming standard login for E2E tests, navigating to home/dashboard
  7  |     await page.goto('/');
  8  | 
  9  |     // Simulate login if necessary
  10 |     // await page.fill('input[name="email"]', 'admin@allure.com');
  11 |     // await page.fill('input[name="password"]', 'password123');
  12 |     // await page.click('button[type="submit"]');
  13 |   });
  14 | 
  15 |   test('Deve cadastrar, alterar cliente, marcar agenda, pagar e validar dashboard', async ({ page }) => {
  16 | 
  17 |     // 1. Cadastrar cliente
  18 |     await test.step('Cadastrar cliente', async () => {
> 19 |       await page.click('text="Clientes"');
     |                  ^ Error: page.click: Test timeout of 30000ms exceeded.
  20 |       await page.click('text="Novo Cliente"');
  21 |       await page.fill('input[name="name"]', 'Cliente E2E Test');
  22 |       await page.fill('input[name="phone"]', '11999999999');
  23 |       await page.click('button:has-text("Salvar")');
  24 |       await expect(page.locator('text="Cliente E2E Test"')).toBeVisible();
  25 |     });
  26 | 
  27 |     // 2. Alterar cliente
  28 |     await test.step('Alterar cliente', async () => {
  29 |       await page.click('text="Cliente E2E Test"');
  30 |       await page.click('text="Editar"');
  31 |       await page.fill('input[name="name"]', 'Cliente E2E Alterado');
  32 |       await page.click('button:has-text("Salvar")');
  33 |       await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
  34 |     });
  35 | 
  36 |     // 3. Marcar na agenda
  37 |     await test.step('Marcar na agenda', async () => {
  38 |       await page.click('text="Agenda"');
  39 |       await page.click('text="Novo Agendamento"');
  40 |       await page.selectOption('select[name="clientId"]', { label: 'Cliente E2E Alterado' });
  41 |       await page.fill('input[name="date"]', '2026-10-10');
  42 |       await page.fill('input[name="time"]', '14:00');
  43 |       await page.click('button:has-text("Agendar")');
  44 |       await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
  45 |     });
  46 | 
  47 |     // 4. Simular recebimento (pagamento do atendimento)
  48 |     await test.step('Simular recebimento', async () => {
  49 |       // Find the appointment card and click to pay/receive
  50 |       await page.click('text="Cliente E2E Alterado"'); // opens details or card
  51 |       await page.click('button:has-text("Receber Pagamento")');
  52 |       await page.selectOption('select[name="paymentMethod"]', 'Pix');
  53 |       await page.click('button:has-text("Confirmar Recebimento")');
  54 |       await expect(page.locator('text="Pago"')).toBeVisible();
  55 |     });
  56 | 
  57 |     // 5. Acessar o Dashboard e ver o relatório mensal
  58 |     await test.step('Acessar Dashboard e validar relatório', async () => {
  59 |       await page.click('text="Dashboard"');
  60 | 
  61 |       // Select monthly filter
  62 |       await page.selectOption('select[name="periodFilter"]', 'Mês');
  63 | 
  64 |       // Verify metrics are displayed
  65 |       await expect(page.locator('text="Total de Atendimentos"')).toBeVisible();
  66 |       await expect(page.locator('text="Faturamento"')).toBeVisible();
  67 |       await expect(page.locator('text="Ticket Médio"')).toBeVisible();
  68 | 
  69 |       // Ensure the newly created payment is somewhat reflected or at least no errors
  70 |       // specific value checks depend on mocking/seed data, so we check for presence
  71 |       const faturamentoValue = page.locator('.faturamento-valor');
  72 |       await expect(faturamentoValue).not.toBeEmpty();
  73 |     });
  74 |   });
  75 | });
  76 | 
```