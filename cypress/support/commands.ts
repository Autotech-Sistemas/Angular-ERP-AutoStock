// cypress/support/commands.ts

Cypress.Commands.add('loginAsAdmin', () => {
  cy.session(
    'admin-session',
    () => {
      cy.visit('/login');
      cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible').type('admin@auto.com');
      cy.get('input[type="password"]').type('Auto123@');
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 15000 }).should('not.include', '/login');
    },
    {
      validate() {
        cy.visit('/vendas');
        cy.url({ timeout: 10000 }).should('not.include', '/login');
      },
      cacheAcrossSpecs: true,
    },
  );
});
