import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: 'product-images.spec.ts',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:9000',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  outputDir: 'artifacts/product-images-5830/playwright',
  reporter: [['list'], ['json', { outputFile: 'artifacts/product-images-5830/playwright-results.json' }]],
})
