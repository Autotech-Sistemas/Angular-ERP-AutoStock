/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>
    }
  }
}

export {}