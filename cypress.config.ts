import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'stvvud',

  e2e: {
    baseUrl: 'http://localhost:4200',
	supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
	allowCypressEnv: false
  }
})