describe('Vehicles E2E', () => {

  beforeEach(() => {
    cy.loginAsAdmin()
  })

  it('deve navegar para página de veículos', () => {
    cy.visit('/vehicles')

    cy.url().should('include', '/vehicles')
    cy.contains('Veículos')
  })

  it('deve listar o veículo mockado (Toyota Corolla)', () => {
    cy.visit('/vehicles')

    cy.contains('Toyota').should('be.visible')
    cy.contains('Corolla').should('be.visible')
    cy.contains('Black').should('be.visible')
  })

  it('deve exibir detalhes do veículo ao abrir visualização', () => {
    cy.visit('/vehicles')

    cy.contains('Toyota')
      .parents('[class*="card"], tr, div')
      .first()
      .click()

    cy.contains('Corolla')
    cy.contains('Premium Sound System')
    cy.contains('Excellent condition')
  })

  it('deve abrir modal de imagens se existir botão', () => {
    cy.visit('/vehicles')

    cy.get('button')
      .contains(/imagem|foto/i)
      .first()
      .click({ force: true })

    cy.get('body').then(($body) => {
      if ($body.find('img').length > 0) {
        cy.get('img').should('exist')
      } else {
        cy.contains('Nenhuma imagem')
      }
    })
  })

  it('deve filtrar veículo pelo nome', () => {
    cy.visit('/vehicles')

    cy.get('input[placeholder*="Buscar"], input[type="search"]')
      .first()
      .type('Toyota')

    cy.contains('Toyota')
    cy.contains('Corolla')
  })

})