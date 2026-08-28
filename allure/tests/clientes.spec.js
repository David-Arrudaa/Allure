import { test, expect } from '@playwright/test';

test.describe('Gestão de Clientes', () => {

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

    // Intercept Clientes
    await page.route('**/rest/v1/customers*', async route => {
      const method = route.request().method();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
      } else if (method === 'GET' || method === 'HEAD') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': '0-24/1'
          },
          body: JSON.stringify([{
            id: '1',
            nome: 'Cliente QA Teste',
            telefone: '11999999999',
            is_whatsapp: true,
            observacoes: 'Cliente mockado',
            appointments: []
          }])
        });
      } else if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: '2',
            nome: 'Novo Cliente Adicionado',
            telefone: '11888888888',
            is_whatsapp: true
          }])
        });
      } else if (method === 'PATCH' || method === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: '1',
            nome: 'Cliente QA Teste Editado',
            telefone: '11999999999',
            is_whatsapp: true
          }])
        });
      } else if (method === 'DELETE') {
        await route.fulfill({
          status: 204,
          contentType: 'application/json',
          body: ''
        });
      } else {
        await route.continue();
      }
    });

    // Add logging
    page.on('request', request => console.log('>>', request.method(), request.url()));
    page.on('response', response => console.log('<<', response.status(), response.url()));

    // Go to login page
    await page.goto('http://localhost:5173/login');
    
    // Fill credentials and click login
    await page.fill('input[type="email"]', 'qa@qa.com');
    await page.fill('input[type="password"]', 'any-password');
    await page.click('button[type="submit"]');

    // Wait for URL to change to agenda or home, then navigate to clientes
    await page.waitForURL('**/agenda', { timeout: 10000 });
    await page.goto('http://localhost:5173/clientes');
    await page.waitForSelector('text=Gestão de Clientes');
  });

  test('Deve listar os clientes', async ({ page }) => {
    // Should display the mocked client
    await expect(page.locator('text=Cliente QA Teste')).toBeVisible();
  });

  test('Deve abrir modal de novo cliente', async ({ page }) => {
    await page.click('button:has-text("Nova Cliente")');
    await expect(page.locator('text=Nova Cliente').first()).toBeVisible();
    await page.fill('input[name="nome"]', 'Novo Cliente Adicionado');
    await page.fill('input[placeholder="(00) 00000-0000"]', '11888888888');
    await page.click('button[type="submit"]:has-text("Salvar")');
    
    // Should close modal (we might need to mock the endpoint properly to avoid errors)
    // After mocking, the modal should close and the UI might update or wait for refetch
  });

  test('Deve abrir modal de edição de cliente', async ({ page }) => {
    await page.click('button[title="Editar Cliente"]');
    await expect(page.locator('text=Editar Cliente')).toBeVisible();
    await page.fill('input[name="nome"]', 'Cliente QA Teste Editado');
    await page.click('button[type="submit"]:has-text("Salvar")');
  });

  test('Deve confirmar exclusão', async ({ page }) => {
    await page.click('button[title="Excluir Cliente"]');
    await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
    await page.click('button:has-text("Sim, apagar")');
  });
});
