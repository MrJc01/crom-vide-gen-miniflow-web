import { test, expect } from '@playwright/test';

test.describe('AI Video Builder Studio - Testes E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the Vite dev server homepage
    await page.goto('/');
  });

  test('deve renderizar a interface do estúdio e carregar os elementos iniciais', async ({ page }) => {
    // Verify header title
    await expect(page.locator('h1')).toContainText('AI Video Builder Studio');
    
    // Verify global settings section
    await expect(page.locator('h3:has-text("Configurações Globais")')).toBeVisible();
    
    // Verify that at least one scene card is loaded by default (Cena 01)
    await expect(page.locator('span:has-text("CENA 01")')).toBeVisible();
  });

  test('deve permitir adicionar e deletar cenas na timeline', async ({ page }) => {
    // Click "Nova Cena" button to add a new card
    const btnNovaCena = page.locator('button:has-text("Nova Cena")');
    await btnNovaCena.click();

    // Verify "CENA 02" card was created
    const cardCenaDois = page.locator('span:has-text("CENA 02")');
    await expect(cardCenaDois).toBeVisible();

    // Delete the scene 02 card
    // Select the active card container and click its delete button
    const cardContainer = page.locator('[data-id]').first();
    const deleteButton = cardContainer.locator('button[title="Deletar cena"]');
    await deleteButton.click();

    // Verify "CENA 02" is no longer visible
    await expect(cardCenaDois).not.toBeVisible();
  });

  test('deve mudar a diretriz de layout ao alterar o template selecionado', async ({ page }) => {
    // Select the first card container
    const card = page.locator('[data-id]').first();
    
    // Check initial guide title (should match Reels Dinâmico by default)
    await expect(card.locator('h4').first()).toContainText('Reels Dinâmico');
    
    // Select Template 2: Documentário
    const selectTemplate = card.locator('select').first();
    await selectTemplate.selectOption('2');

    // Confirm that guide title updated to Documentário
    await expect(card.locator('h4').first()).toContainText('Documentário');
    
    // Verify template description changed to landscape/cinematic instructions
    await expect(card.locator('text=Exatamente 1 mídia de fundo')).toBeVisible();
  });

    test('deve estimar o tempo de áudio da narração em tempo real', async ({ page }) => {
    const card = page.locator('[data-id]').first();
    const textarea = card.locator('textarea');
    
    // Open collapsible settings to make audio duration visible
    await card.locator('summary:has-text("Configurações & Ajustes do Take")').click();
    
    // Initially estimated audio should be ~4.8s due to default text
    await expect(card.locator('text=~ 4.8s')).toBeVisible();

    // Type a simple short sentence
    await textarea.fill('Olá mundo');
    
    // Verify audio duration estimation updates
    // "Olá mundo" has 2 words. 2 / 2.3 = ~0.9s
    await expect(card.locator('text=~ 0.9s')).toBeVisible();
  });

  test('deve auto-ajustar a duração do take se for menor que o tempo de áudio', async ({ page }) => {
    const card = page.locator('[data-id]').first();
    const textarea = card.locator('textarea');
    
    // Open collapsible settings to make duration input visible
    await card.locator('summary:has-text("Configurações & Ajustes do Take")').click();
    
    const durationInput = card.locator('input[type="number"]');

    // Set take duration manually to a low value (e.g. 1 second)
    await durationInput.fill('1');
    await durationInput.blur();

    // Fill the textarea with a very long paragraph of text to trigger timing adjustment
    // (Needs to exceed 1 second. E.g. 10 words = ~4.3s)
    await textarea.fill('Este é um texto consideravelmente longo criado especificamente para testar o auto-ajuste de tempo.');
    await textarea.blur();

    // The duration input should automatically jump to a value greater than or equal to estimated audio (~4.3s + 1s = 6s)
    const updatedValue = await durationInput.inputValue();
    expect(parseFloat(updatedValue)).toBeGreaterThanOrEqual(5);
  });

  test('deve compilar e exibir a estrutura JSON ao clicar no exportador', async ({ page }) => {
    // Scroll down and click the "Gerar Estrutura JSON" button
    const btnGenerate = page.locator('button:has-text("Gerar Estrutura JSON")');
    await btnGenerate.click();

    // Verify the export container is visible
    await expect(page.locator('text=Estrutura JSON Consolidada')).toBeVisible();

    // Toggle the format to Engine (Go) which includes the project name
    const btnEngine = page.locator('button:has-text("Engine (Go)")');
    await btnEngine.click();

    // Verify the compiled output contains our project settings
    const codeOutput = page.locator('pre code');
    await expect(codeOutput).toContainText('meu_video_projeto');
  });

});
