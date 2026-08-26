# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\fase2.spec.js >> Evolução Fase 2 - Homologação >> Compra de Pacote e diminuição de saldo de sessões
- Location: e2e\fase2.spec.js:16:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Pacotes')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Pacotes')

```

```yaml
- img "Logo Allure"
- paragraph: Gestão Inteligente
- heading "Bem-vindo(a)" [level=2]
- paragraph: Acesse sua plataforma de gestão.
- text: E-mail
- textbox "E-mail":
  - /placeholder: contato@salao.com
- text: Senha
- textbox "Senha":
  - /placeholder: ••••••••
- button "Entrar na plataforma"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Evolução Fase 2 - Homologação', () => {
  4  | 
  5  |   test('Fluxo de Agendamento Público (acesso anônimo ok, sem acesso a rotas privadas)', async ({ page }) => {
  6  |     // Acessa a rota pública
  7  |     await page.goto('/agendar/tenant-123');
  8  |     await expect(page.locator('text=Agendamento')).toBeVisible();
  9  | 
  10 |     // Tenta acessar rota privada
  11 |     await page.goto('/pacotes');
  12 |     // Deve redirecionar para login
  13 |     await expect(page).toHaveURL(/.*login/);
  14 |   });
  15 | 
  16 |   test('Compra de Pacote e diminuição de saldo de sessões', async ({ page }) => {
  17 |     // Simula login
  18 |     await page.goto('/login');
  19 |     // ... preenchimento de login ...
  20 |     
  21 |     // Acessa pacotes
  22 |     await page.goto('/pacotes');
> 23 |     await expect(page.locator('text=Pacotes')).toBeVisible();
     |                                                ^ Error: expect(locator).toBeVisible() failed
  24 |     
  25 |     // Validar se compra de pacote reduz saldo (mock/UI test)
  26 |   });
  27 | 
  28 |   test('Disparo de Avaliação no fim do atendimento', async ({ page }) => {
  29 |     // Acessa configurações
  30 |     await page.goto('/configuracoes');
  31 |     await expect(page.locator('text=WhatsApp')).toBeVisible();
  32 |   });
  33 | 
  34 | });
  35 | 
```