# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\agenda-qa.spec.js >> Agenda - Usability QA >> Deve carregar a página da Agenda corretamente
- Location: tests\agenda-qa.spec.js:49:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Agenda - Usability QA', () => {
  4  | 
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Intercept Supabase Auth
  7  |     await page.route('**/auth/v1/token?grant_type=password', async route => {
  8  |       await route.fulfill({
  9  |         status: 200,
  10 |         contentType: 'application/json',
  11 |         body: JSON.stringify({
  12 |           access_token: 'fake-jwt-token',
  13 |           refresh_token: 'fake-jwt-token',
  14 |           expires_in: 3600,
  15 |           token_type: 'bearer',
  16 |           user: { id: 'test-user-id', email: 'qa@qa.com' }
  17 |         })
  18 |       });
  19 |     });
  20 | 
  21 |     // Intercept Profissionais (login profile check)
  22 |     await page.route('**/rest/v1/profissionais*', async route => {
  23 |       await route.fulfill({
  24 |         status: 200,
  25 |         contentType: 'application/json',
  26 |         body: JSON.stringify([{
  27 |           id: 'test-user-id',
  28 |           nome: 'QA User',
  29 |           email: 'qa@qa.com',
  30 |           tenant_id: 'test-tenant',
  31 |           is_admin: true
  32 |         }])
  33 |       });
  34 |     });
  35 | 
  36 |     console.log("Navigating to login...");
> 37 |     await page.goto('http://localhost:5173/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  38 |     console.log("Filling credentials...");
  39 |     await page.fill('input[type="email"]', 'qa@qa.com');
  40 |     await page.fill('input[type="password"]', 'any-password');
  41 |     console.log("Clicking submit...");
  42 |     await page.click('button[type="submit"]');
  43 |     
  44 |     console.log("Waiting for URL to change to agenda...");
  45 |     await page.waitForURL('**/agenda', { timeout: 10000 });
  46 |     console.log("Setup complete!");
  47 |   });
  48 | 
  49 |   test('Deve carregar a página da Agenda corretamente', async ({ page }) => {
  50 |     console.log("Current URL:", page.url());
  51 |     await expect(page).toHaveURL(/.*agenda/);
  52 |     await expect(page.locator('h2:has-text("Agenda do Dia")')).toBeVisible();
  53 |     await expect(page.locator('button:has-text("Novo Agendamento")')).toBeVisible();
  54 |   });
  55 | 
  56 |   test('Interação de navegação de dias', async ({ page }) => {
  57 |     const todayBtn = page.locator('button:has-text("Hoje")');
  58 |     const prevBtn = page.locator('button:has-text("< Anterior")');
  59 |     const nextBtn = page.locator('button:has-text("Próxima >")');
  60 | 
  61 |     await expect(todayBtn).toBeVisible();
  62 |     await expect(prevBtn).toBeVisible();
  63 |     await expect(nextBtn).toBeVisible();
  64 | 
  65 |     await nextBtn.click();
  66 |     await page.waitForTimeout(500); 
  67 |     await prevBtn.click();
  68 |     await todayBtn.click();
  69 |   });
  70 | 
  71 |   test('Abertura do modal de Novo Agendamento', async ({ page }) => {
  72 |     await page.click('button:has-text("Novo Agendamento")');
  73 |     await expect(page.locator('h2:has-text("Novo Agendamento")')).toBeVisible();
  74 | 
  75 |     await expect(page.getByPlaceholder('Digite o nome da cliente...')).toBeVisible();
  76 |     await expect(page.locator('input[type="date"]').first()).toBeVisible();
  77 |     await expect(page.locator('input[type="time"]').first()).toBeVisible();
  78 | 
  79 |     await page.locator('button[aria-label="Fechar modal"]').first().click();
  80 |   });
  81 | 
  82 |   test('Interação com filtro de profissionais', async ({ page }) => {
  83 |     // The button text was changed from "Filtro Profissionais" to "Profissionais"
  84 |     const filterBtn = page.locator('button:has-text("Profissionais")');
  85 |     await filterBtn.click();
  86 | 
  87 |     // The dropdown text was changed from "Exibir colunas:" to "Filtrar Equipe"
  88 |     await expect(page.locator('text=Filtrar Equipe')).toBeVisible();
  89 | 
  90 |     const checkboxes = page.locator('input[type="checkbox"]');
  91 |     if (await checkboxes.count() > 0) {
  92 |       await expect(checkboxes.first()).toBeVisible();
  93 |     }
  94 | 
  95 |     // Toggle the filter back off
  96 |     await filterBtn.click();
  97 |   });
  98 | });
  99 | 
```