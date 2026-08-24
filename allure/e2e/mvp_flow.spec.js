const { test, expect } = require('@playwright/test');

test.describe('MVP Flow - Critical Path', () => {

  test.beforeEach(async ({ page }) => {
    // Assuming standard login for E2E tests, navigating to home/dashboard
    await page.goto('/');

    // Simulate login if necessary
    // await page.fill('input[name="email"]', 'admin@allure.com');
    // await page.fill('input[name="password"]', 'password123');
    // await page.click('button[type="submit"]');
  });

  test('Deve cadastrar, alterar cliente, marcar agenda, pagar e validar dashboard', async ({ page }) => {

    // 1. Cadastrar cliente
    await test.step('Cadastrar cliente', async () => {
      await page.click('text="Clientes"');
      await page.click('text="Novo Cliente"');
      await page.fill('input[name="name"]', 'Cliente E2E Test');
      await page.fill('input[name="phone"]', '11999999999');
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('text="Cliente E2E Test"')).toBeVisible();
    });

    // 2. Alterar cliente
    await test.step('Alterar cliente', async () => {
      await page.click('text="Cliente E2E Test"');
      await page.click('text="Editar"');
      await page.fill('input[name="name"]', 'Cliente E2E Alterado');
      await page.click('button:has-text("Salvar")');
      await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
    });

    // 3. Marcar na agenda
    await test.step('Marcar na agenda', async () => {
      await page.click('text="Agenda"');
      await page.click('text="Novo Agendamento"');
      await page.selectOption('select[name="clientId"]', { label: 'Cliente E2E Alterado' });
      await page.fill('input[name="date"]', '2026-10-10');
      await page.fill('input[name="time"]', '14:00');
      await page.click('button:has-text("Agendar")');
      await expect(page.locator('text="Cliente E2E Alterado"')).toBeVisible();
    });

    // 4. Simular recebimento (pagamento do atendimento)
    await test.step('Simular recebimento', async () => {
      // Find the appointment card and click to pay/receive
      await page.click('text="Cliente E2E Alterado"'); // opens details or card
      await page.click('button:has-text("Receber Pagamento")');
      await page.selectOption('select[name="paymentMethod"]', 'Pix');
      await page.click('button:has-text("Confirmar Recebimento")');
      await expect(page.locator('text="Pago"')).toBeVisible();
    });

    // 5. Acessar o Dashboard e ver o relatório mensal
    await test.step('Acessar Dashboard e validar relatório', async () => {
      await page.click('text="Dashboard"');

      // Select monthly filter
      await page.selectOption('select[name="periodFilter"]', 'Mês');

      // Verify metrics are displayed
      await expect(page.locator('text="Total de Atendimentos"')).toBeVisible();
      await expect(page.locator('text="Faturamento"')).toBeVisible();
      await expect(page.locator('text="Ticket Médio"')).toBeVisible();

      // Ensure the newly created payment is somewhat reflected or at least no errors
      // specific value checks depend on mocking/seed data, so we check for presence
      const faturamentoValue = page.locator('.faturamento-valor');
      await expect(faturamentoValue).not.toBeEmpty();
    });
  });
});
