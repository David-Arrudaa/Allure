# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\allure.spec.js >> Allure SaaS E2E Tests >> Filtros do Dashboard - deve atualizar métricas ao mudar o filtro
- Location: e2e\allure.spec.js:84:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select[name="filtro-periodo"]')

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - generic [ref=f1e6]:
    - img "Logo Allure" [ref=f1e7]
    - paragraph [ref=f1e8]: Gestão Inteligente
  - generic [ref=f1e10]:
    - heading "Bem-vindo(a)" [level=2] [ref=f1e11]
    - paragraph [ref=f1e12]: Acesse sua plataforma de gestão.
    - generic [ref=f1e13]:
      - generic [ref=f1e14]:
        - generic [ref=f1e15]: E-mail
        - textbox "E-mail" [ref=f1e16]:
          - /placeholder: contato@salao.com
      - generic [ref=f1e17]:
        - generic [ref=f1e18]: Senha
        - textbox "Senha" [ref=f1e19]:
          - /placeholder: ••••••••
      - button "Entrar na plataforma" [ref=f1e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Allure SaaS E2E Tests', () => {
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
  19 |     // Go to the starting URL before each test.
  20 |     await page.goto('http://localhost:5173/'); // Adjust port as needed
  21 |   });
  22 | 
  23 |   test('Login bypass via LocalStorage - deve carregar a agenda diretamente', async ({ page }) => {
  24 |     await page.goto('http://localhost:5173/agenda');
  25 |     // Como injetamos o localStorage, a rota privada deve autorizar
  26 |     await expect(page).toHaveURL(/.*agenda/);
  27 |     await expect(page.locator('text=Gestão Inteligente').or(page.locator('button:has-text("Novo Agendamento")'))).toBeVisible();
  28 |   });
  29 | 
  30 |   test('Cadastro, Edição e Busca de Clientes - deve criar, editar e validar na tabela', async ({ page }) => {
  31 |     await page.goto('http://localhost:5173/clientes');
  32 |     
  33 |     // Cadastrar cliente
  34 |     await page.click('button:has-text("Nova Cliente")');
  35 |     await page.fill('input[name="nome"]', 'Maria Silva Teste');
  36 |     await page.locator('input[name="telefone"]').type('11987654321', { delay: 50 });
  37 |     await page.check('input[name="eWhatsApp"]');
  38 |     await page.click('button[type="submit"]');
  39 |     
  40 |     // Buscar e validar criação
  41 |     const searchInput = page.locator('input[placeholder="Buscar por nome..."]');
  42 |     await searchInput.fill('Maria Silva Teste');
  43 |     await page.waitForTimeout(1000); // debounce + request
  44 |     
  45 |     const tableRows = page.locator('table tbody tr');
  46 |     await expect(tableRows.first()).toContainText('Maria Silva Teste');
  47 |     await expect(tableRows.first()).toContainText('(11) 98765-4321');
  48 |     
  49 |     // Editar cliente
  50 |     await page.click('button[title="Editar Cliente"]');
  51 |     await page.fill('input[name="nome"]', 'Maria Silva Editada');
  52 |     await page.locator('input[name="telefone"]').clear();
  53 |     await page.locator('input[name="telefone"]').type('11999999999', { delay: 50 });
  54 |     await page.uncheck('input[name="eWhatsApp"]');
  55 |     await page.click('button[type="submit"]');
  56 |     
  57 |     // Buscar e validar edição
  58 |     await searchInput.fill('Maria Silva Editada');
  59 |     await page.waitForTimeout(1000);
  60 |     
  61 |     await expect(tableRows.first()).toContainText('Maria Silva Editada');
  62 |     await expect(tableRows.first()).toContainText('(11) 99999-9999');
  63 |   });
  64 | 
  65 |   test('Agendamento de Serviço - deve criar um novo agendamento', async ({ page }) => {
  66 |     await page.goto('http://localhost:5173/agenda');
  67 |     
  68 |     // Open modal
  69 |     await page.click('button:has-text("Novo Agendamento")');
  70 |     
  71 |     // Fill the form
  72 |     await page.selectOption('select[name="cliente"]', { index: 1 });
  73 |     await page.selectOption('select[name="servico"]', { label: 'Corte de Cabelo' });
  74 |     await page.fill('input[type="date"]', '2027-10-10');
  75 |     await page.fill('input[type="time"]', '14:30');
  76 |     
  77 |     // Submit
  78 |     await page.click('button:has-text("Salvar")');
  79 |     
  80 |     // Expect modal to disappear or success message to show
  81 |     await expect(page.locator('text=Agendamento criado com sucesso')).toBeVisible();
  82 |   });
  83 | 
  84 |   test('Filtros do Dashboard - deve atualizar métricas ao mudar o filtro', async ({ page }) => {
  85 |     await page.goto('http://localhost:5173/dashboard');
  86 |     
  87 |     // Select filter
> 88 |     await page.selectOption('select[name="filtro-periodo"]', 'este-mes');
     |                ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
  89 |     
  90 |     // Check if the dashboard metric (e.g., Faturamento) updates/loads
  91 |     await expect(page.locator('.metric-faturamento')).toBeVisible();
  92 |     await expect(page.locator('.metric-faturamento')).not.toBeEmpty();
  93 |   });
  94 | 
  95 | });
  96 | 
```