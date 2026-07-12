import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Helper to check if api server is responsive on port 8080
function checkApiResponsive(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port,
      path: '/api/templates',
      method: 'GET',
      timeout: 1000
    };
    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

// Helper to count current jobs via API
function getJobCount(port: number): Promise<number> {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: 'localhost', port, path: '/api/videos', method: 'GET', timeout: 2000 },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => (body += chunk.toString()));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(Object.keys(data).length);
          } catch {
            resolve(0);
          }
        });
      }
    );
    req.on('error', () => resolve(0));
    req.end();
  });
}

test.describe('Estúdio Web - Geração de Vídeo e Integração API', () => {
  // Run tests serially to avoid HMR race conditions
  test.describe.configure({ mode: 'serial' });

  let serverProcess: ChildProcess | null = null;

  test.beforeAll(async () => {
    const isActive = await checkApiResponsive(8080);
    if (!isActive) {
      console.log('Servidor videogen-server não ativo na porta 8080. Inicializando binário local...');
      serverProcess = spawn('./build/videogen-server', [], {
        stdio: 'ignore',
        detached: false
      });
      for (let i = 0; i < 10; i++) {
        const responsive = await checkApiResponsive(8080);
        if (responsive) {
          console.log('videogen-server iniciado e respondendo.');
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } else {
      console.log('videogen-server já está rodando. Reutilizando.');
    }
  });

  test.afterAll(async () => {
    if (serverProcess) {
      console.log('Finalizando processo do videogen-server criado para o teste...');
      serverProcess.kill('SIGINT');
    }
  });

  test('deve verificar que o servidor está online e exibir status correto', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const statusOnline = page.locator('span:has-text("Online")');
    await expect(statusOnline).toBeVisible({ timeout: 8000 });
  });

  test('deve submeter o roteiro para renderização e monitorar o status do job', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open settings sidebar drawer to make render queue visible
    const btnConfig = page.locator('button:has-text("Configurações")');
    await btnConfig.click();

    // Wait for server connection — the "Fila de Renderização" section only appears when connected
    const renderQueueHeading = page.locator('text=Fila de Renderização');
    await expect(renderQueueHeading).toBeVisible({ timeout: 8000 });

    // Write narration in the first card's textarea
    const textarea = page.locator('[data-id] textarea').first();
    await textarea.fill('Olá, este é um vídeo de teste gerado de forma totalmente automatizada.');

    // Trigger full video render
    const btnRender = page.locator('button:has-text("Renderizar Vídeo Completo")');
    await expect(btnRender).toBeEnabled({ timeout: 3000 });
    await btnRender.click();

    // Wait for at least one job card with the project name to appear in the render queue
    const jobTitle = page.locator('h4:has-text("meu_video_projeto")').first();
    await expect(jobTitle).toBeVisible({ timeout: 8000 });

    // Locate the newest job in the list
    const newestJob = page.locator('div.job-item').filter({ hasText: 'meu_video_projeto' }).first();

    console.log('Validando renderização com sucesso...');
    const successBadge = newestJob.locator('span:has-text("CONCLUÍDO")');
    await expect(successBadge).toBeVisible({ timeout: 30000 });

    const downloadBtn = newestJob.locator('a:has-text("BAIXAR MP4")');
    await expect(downloadBtn).toBeVisible();

    // Verify the physical video file actually exists on the host machine and is not empty
    const href = await downloadBtn.getAttribute('href');
    expect(href).toBeTruthy();
    
    const filename = href!.split('/').pop();
    expect(filename).toBeTruthy();
    
    const filePath = path.join(process.cwd(), 'outputs', filename!);
    expect(fs.existsSync(filePath)).toBe(true);
    
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(0);
    console.log(`Sucesso: Vídeo gerado fisicamente em ${filePath} (${(stats.size / 1024).toFixed(1)} KB)`);
  });

  test('deve gerar o JSON no formato Engine (Go) com a estrutura correta para o backend', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for page to be fully stable (no more HMR reloads)
    await page.waitForTimeout(500);

    // Fill in a narration
    const textarea = page.locator('[data-id] textarea').first();
    await textarea.fill('Texto de teste para validação do formato engine.');

    // Open settings sidebar drawer to make JSON exporter button visible
    const btnConfig = page.locator('button:has-text("Configurações")');
    await btnConfig.click();

    // Click the "Gerar Estrutura JSON" button
    const btnJson = page.locator('button:has-text("Gerar Estrutura JSON")');
    await expect(btnJson).toBeVisible({ timeout: 5000 });
    await btnJson.click();

    // Wait for the export panel heading to appear
    await expect(page.locator('text=Estrutura JSON Consolidada')).toBeVisible({ timeout: 5000 });

    // Wait a beat for DOM to stabilize after state change
    await page.waitForTimeout(300);

    // Click Engine (Go) format toggle
    const btnEngine = page.locator('button:has-text("Engine (Go)")');
    await expect(btnEngine).toBeVisible({ timeout: 5000 });
    await btnEngine.click();

    // Wait for JSON to update
    await page.waitForTimeout(300);

    // Read the JSON output from the pre > code element
    const jsonOutput = page.locator('pre code');
    await expect(jsonOutput).toBeVisible({ timeout: 3000 });

    const jsonText = await jsonOutput.textContent();
    expect(jsonText).toBeTruthy();

    const parsed = JSON.parse(jsonText!);
    // Engine format should have template_id, resolution, fps, cards
    expect(parsed).toHaveProperty('template_id');
    expect(parsed).toHaveProperty('resolution');
    expect(parsed).toHaveProperty('fps');
    expect(parsed).toHaveProperty('cards');
    expect(Array.isArray(parsed.cards)).toBe(true);
    expect(parsed.cards.length).toBeGreaterThan(0);

    // Each card should have id, duration_ms, elements
    const firstCard = parsed.cards[0];
    expect(firstCard).toHaveProperty('id');
    expect(firstCard).toHaveProperty('duration_ms');
    expect(firstCard).toHaveProperty('elements');
    expect(Array.isArray(firstCard.elements)).toBe(true);

    // Verify card contains the narration property
    expect(firstCard.narration).toContain('Texto de teste');
  });
});
