describe('Login E2E', () => {
  it('deve logar com admin mockado', () => {
    cy.visit('/login');

    cy.get('input[type="email"]').type('admin@auto.com');
    cy.get('input[type="password"]').type('Auto123@');
    // use a senha correspondente ao hash salvo no backend

    cy.get('button[type="submit"]').click();

    cy.url().should('not.include', '/login');
    cy.contains('Dashboard');
  });
});
