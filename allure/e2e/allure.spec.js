const { test, expect } = require('@playwright/test');

test.describe('Allure SaaS E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Go to the starting URL before each test.
    await page.goto('http://localhost:5173/'); // Adjust port as needed
  });

  test('Login - deve autenticar e redirecionar para o dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'teste@allure.com.br');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // Wait for URL to change to dashboard or expect a dashboard element
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Cadastro, Edição e Busca de Clientes - deve criar, editar e validar na tabela', async ({ page }) => {
    await page.goto('http://localhost:5173/clientes');
    
    // Cadastrar cliente
    await page.click('button:has-text("Nova Cliente")');
    await page.fill('input[name="nome"]', 'Maria Silva Teste');
    await page.locator('input[name="telefone"]').type('11987654321', { delay: 50 });
    await page.check('input[name="eWhatsApp"]');
    await page.click('button[type="submit"]');
    
    // Buscar e validar criação
    const searchInput = page.locator('input[placeholder="Buscar por nome..."]');
    await searchInput.fill('Maria Silva Teste');
    await page.waitForTimeout(1000); // debounce + request
    
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first()).toContainText('Maria Silva Teste');
    await expect(tableRows.first()).toContainText('(11) 98765-4321');
    
    // Editar cliente
    await page.click('button[title="Editar Cliente"]');
    await page.fill('input[name="nome"]', 'Maria Silva Editada');
    await page.locator('input[name="telefone"]').clear();
    await page.locator('input[name="telefone"]').type('11999999999', { delay: 50 });
    await page.uncheck('input[name="eWhatsApp"]');
    await page.click('button[type="submit"]');
    
    // Buscar e validar edição
    await searchInput.fill('Maria Silva Editada');
    await page.waitForTimeout(1000);
    
    await expect(tableRows.first()).toContainText('Maria Silva Editada');
    await expect(tableRows.first()).toContainText('(11) 99999-9999');
  });

  test('Agendamento de Serviço - deve criar um novo agendamento', async ({ page }) => {
    await page.goto('http://localhost:5173/agenda');
    
    // Open modal
    await page.click('button:has-text("Novo Agendamento")');
    
    // Fill the form
    await page.selectOption('select[name="cliente"]', { index: 1 });
    await page.selectOption('select[name="servico"]', { label: 'Corte de Cabelo' });
    await page.fill('input[type="date"]', '2027-10-10');
    await page.fill('input[type="time"]', '14:30');
    
    // Submit
    await page.click('button:has-text("Salvar")');
    
    // Expect modal to disappear or success message to show
    await expect(page.locator('text=Agendamento criado com sucesso')).toBeVisible();
  });

  test('Filtros do Dashboard - deve atualizar métricas ao mudar o filtro', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    
    // Select filter
    await page.selectOption('select[name="filtro-periodo"]', 'este-mes');
    
    // Check if the dashboard metric (e.g., Faturamento) updates/loads
    await expect(page.locator('.metric-faturamento')).toBeVisible();
    await expect(page.locator('.metric-faturamento')).not.toBeEmpty();
  });

});
