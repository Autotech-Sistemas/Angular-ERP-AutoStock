import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: 'stvvud',

  e2e: {
    baseUrl: 'http://localhost:4200',
    supportFile: 'cypress/support/e2e.ts',
    pageLoadTimeout: 30000,
    defaultCommandTimeout: 8000,
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    allowCypressEnv: false,
    setupNodeEvents(on, config) {
      // Adicione plugins aqui se necessário
    },
  },
});
