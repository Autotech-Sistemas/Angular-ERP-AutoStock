Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login');
  cy.get('input[type="email"]').type('admin@auto.com');
  cy.get('input[type="password"]').type('Auto123@');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

describe('Fluxo de Veículos (CRUD e Catálogo)', () => {
  const apiUrl = '**/api/vehicles';

  beforeEach(() => {
    // 1. Mantém a resolução desktop para o menu não sobrepor
    cy.viewport(1366, 768);

    // 2. Prepara para interceptar a chamada do backend
    cy.intercept('GET', `${apiUrl}*`).as('getVehicles');

    // 3. Faz o login usando o seu comando customizado
    cy.loginAsAdmin();

    // 4. O SEGREDO ESTÁ AQUI: Navegar para a página de veículos!
    // IMPORTANTE: Mude para '/vehicles' se a sua rota no Angular estiver em inglês
    cy.visit('/veiculos');

    // 5. Espera os dados do Spring Boot chegarem
    cy.wait('@getVehicles');
  });

  // --- 1. LISTAGEM ---
  it('deve carregar a tela, exibir a tabela e o filtro', () => {
    cy.get('.page-title').contains('Veículos').should('be.visible');
    cy.get('.data-table').should('be.visible');
    cy.get('input[type="search"]').should('be.visible');
    cy.get('select[aria-label="Filtrar por tipo"]').should('be.visible');
  });

  // --- 2. FILTRO INTELIGENTE ---
  it('deve filtrar veículos dinamicamente capturando um dado da tabela', () => {
    cy.get('tbody tr')
      .first()
      .find('td')
      .eq(1)
      .then(($td) => {
        const vehicleName = $td.find('.font-medium').text().trim(); // só pega marca + modelo
        cy.get('input[type="search"]').clear().type(vehicleName);
        cy.get('tbody tr').first().find('td').eq(1).should('contain.text', vehicleName);
      });
  });

  // --- 3. MODAL DE CRIAÇÃO ---
  it('deve abrir o modal de Novo Veículo', () => {
    cy.contains('button', 'Novo Veículo').click();
    cy.get('app-vehicle-form').should('be.visible');
  });

  // --- 4. MODAL DE VISUALIZAÇÃO ---
  it('deve abrir o modal de detalhes do veículo (View)', () => {
    cy.get('tbody tr').first().find('button[title="Ver detalhes"]').click({ force: true });
    cy.get('app-vehicle-view').should('be.visible');
  });

  // --- 5. MODAL DE IMAGENS ---
  it('deve abrir o gerenciador de imagens do veículo', () => {
    cy.get('tbody tr')
      .first()
      .within(() => {
        cy.get(
          '[title="Ver/adicionar imagens"], [title="Adicionar imagens"], button[title="Gerenciar imagens"]',
        )
          .first()
          .click({ force: true });
      });
    cy.get('app-vehicle-images-modal').should('be.visible');
  });

  // --- 6. EXCLUSÃO (MOCKADA PARA EVITAR ERRO 409 DO BANCO) ---
  it('deve simular a exclusão de um veículo com o SweetAlert', () => {
    // Intercepta a chamada DELETE e FORÇA a resposta ser 204 (Sucesso),
    // ignorando o bloqueio de chave estrangeira do backend real.
    cy.intercept('DELETE', `${apiUrl}/*`, { statusCode: 204 }).as('deleteVehicle');
    cy.intercept('GET', `${apiUrl}*`).as('reloadVehicles');

    // Clica no botão "Excluir" da primeira linha
    cy.get('tbody tr').first().contains('Excluir').click({ force: true });

    // Clica no "Sim, excluir" do popup
    cy.contains('button', 'Sim, excluir').should('be.visible').click();

    // Valida se o Cypress interceptou com sucesso
    cy.wait('@deleteVehicle');

    // Verifica se a mensagem verde do Toast apareceu na tela
    cy.contains('Veículo excluído!').should('be.visible');

    // Aguarda a tabela recarregar
    cy.wait('@reloadVehicles');
  });

  // --- 7. EDIÇÃO ---
  it('deve abrir o modal de edição e salvar as alterações', () => {
    // Intercepta apenas o PATCH, que é o método real que sua API usa
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateVehiclePatch');
    cy.intercept('GET', `${apiUrl}*`).as('reloadVehicles');

    // Clica no botão "Editar" da primeira linha
    cy.get('tbody tr').first().contains('Editar').click({ force: true });

    // Verifica se o componente do formulário apareceu na tela
    cy.get('app-vehicle-form').should('be.visible');

    // Clica em Salvar
    cy.get('app-vehicle-form')
      .contains('button', /salvar|atualizar/i)
      .click();

    // Aguarda apenas a chamada PATCH finalizar
    cy.wait('@updateVehiclePatch');

    // Aguarda a tabela recarregar após o salvamento
    cy.wait('@reloadVehicles');

    // O modal deve fechar automaticamente
    cy.get('app-vehicle-form').should('not.be.visible');
  });
});
