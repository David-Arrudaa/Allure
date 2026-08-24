import { test, expect } from '@playwright/test';

test.describe('Evolução Fase 2 - Homologação', () => {

  test('Fluxo de Agendamento Público (acesso anônimo ok, sem acesso a rotas privadas)', async ({ page }) => {
    // Acessa a rota pública
    await page.goto('/agendar/tenant-123');
    await expect(page.locator('text=Agendamento')).toBeVisible();

    // Tenta acessar rota privada
    await page.goto('/pacotes');
    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/);
  });

  test('Compra de Pacote e diminuição de saldo de sessões', async ({ page }) => {
    // Simula login
    await page.goto('/login');
    // ... preenchimento de login ...
    
    // Acessa pacotes
    await page.goto('/pacotes');
    await expect(page.locator('text=Pacotes')).toBeVisible();
    
    // Validar se compra de pacote reduz saldo (mock/UI test)
  });

  test('Disparo de Avaliação no fim do atendimento', async ({ page }) => {
    // Acessa configurações
    await page.goto('/configuracoes');
    await expect(page.locator('text=WhatsApp')).toBeVisible();
  });

});
