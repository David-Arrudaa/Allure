import { test, expect } from '@playwright/test';

test.describe('Agenda - Usability QA', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept Supabase Auth
    await page.route('**/auth/v1/token?grant_type=password', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-jwt-token',
          refresh_token: 'fake-jwt-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'test-user-id', email: 'qa@qa.com' }
        })
      });
    });

    // Intercept Profissionais (login profile check)
    await page.route('**/rest/v1/profissionais*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-user-id',
          nome: 'QA User',
          email: 'qa@qa.com',
          tenant_id: 'test-tenant',
          is_admin: true
        }])
      });
    });

    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/login');
    console.log("Filling credentials...");
    await page.fill('input[type="email"]', 'qa@qa.com');
    await page.fill('input[type="password"]', 'any-password');
    console.log("Clicking submit...");
    await page.click('button[type="submit"]');
    
    console.log("Waiting for URL to change to agenda...");
    await page.waitForURL('**/agenda', { timeout: 10000 });
    console.log("Setup complete!");
  });

  test('Deve carregar a página da Agenda corretamente', async ({ page }) => {
    console.log("Current URL:", page.url());
    await expect(page).toHaveURL(/.*agenda/);
    await expect(page.locator('h2:has-text("Agenda do Dia")')).toBeVisible();
    await expect(page.locator('button:has-text("Novo Agendamento")')).toBeVisible();
  });

  test('Interação de navegação de dias', async ({ page }) => {
    const todayBtn = page.locator('button:has-text("Hoje")');
    const prevBtn = page.locator('button:has-text("< Anterior")');
    const nextBtn = page.locator('button:has-text("Próxima >")');

    await expect(todayBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    await nextBtn.click();
    await page.waitForTimeout(500); 
    await prevBtn.click();
    await todayBtn.click();
  });

  test('Abertura do modal de Novo Agendamento', async ({ page }) => {
    await page.click('button:has-text("Novo Agendamento")');
    await expect(page.locator('h2:has-text("Novo Agendamento")')).toBeVisible();

    await expect(page.getByPlaceholder('Digite o nome da cliente...')).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();

    await page.locator('button[aria-label="Fechar modal"]').first().click();
  });

  test('Interação com filtro de profissionais', async ({ page }) => {
    const filterBtn = page.locator('button:has-text("Filtro Profissionais")');
    await filterBtn.click();
    
    await expect(page.locator('text=Exibir colunas:')).toBeVisible();
    
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await expect(checkboxes.first()).toBeVisible();
    }
    
    // Toggle the filter back off
    await filterBtn.click();
  });
});
