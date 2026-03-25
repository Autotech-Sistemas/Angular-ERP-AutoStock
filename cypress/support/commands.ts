Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');

  cy.get('input[type="email"]').type('admin@auto.com');
  cy.get('input[type="password"]').type('123456');

  cy.get('button[type="submit"]').click();

  cy.url().should('not.include', '/login');
});
