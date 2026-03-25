describe('Fluxo Completo de Contratos (CRUD com Spring Boot)', () => {
  const apiUrl = '**/api/contracts'; // Rota base de contratos

  beforeEach(() => {
    // 1. Configuração de tela (Desktop)
    cy.viewport(1366, 768);
    
    // 2. Intercepta a rota principal de contratos
    cy.intercept('GET', `${apiUrl}*`).as('getContracts');
    
    // 3. Autenticação (Login do Admin)
    cy.visit('http://localhost:4200/'); 
    cy.get('#email').should('be.visible').type('admin@auto.com');
    cy.get('#password').type('Auto123@');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', 'login');

    // 4. Acesso à tela (Ajuste a rota se a sua URL de contratos for diferente, ex: /contratos)
    cy.visit('http://localhost:4200/contratos');
    cy.wait('@getContracts');
  });

  // --- 1. READ (Listagem em Cards) ---
  it('deve carregar a tela e exibir os cards de contratos', () => {
    cy.get('.page-title').contains('Contratos').should('be.visible');
    
    // Como você usa cards em vez de tabela, procuramos pela classe .branch-card
    cy.get('.branch-card').should('have.length.greaterThan', 0);
  });

  // --- 2. CREATE (Criação) ---
  it('deve criar um novo contrato com sucesso', () => {
    cy.intercept('POST', apiUrl).as('createContract');
    // Intercepta a rota de vendas que alimenta o select do modal
    cy.intercept('GET', '**/api/sales*').as('getSales');
    cy.intercept('GET', `${apiUrl}*`).as('reloadContracts');

    cy.contains('button', 'Novo Contrato').click();
    
    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Novo Contrato').should('be.visible');

    // Espera as vendas chegarem do backend
    cy.wait('@getSales');

    // Preenche os campos de texto e data
    cy.get('#ct-num').type('CONT-2026-001');
    cy.get('#ct-type').type('Compra e Venda Padrão');
    cy.get('#ct-date').type('2026-03-25');
    cy.get('#ct-del').type('2026-04-10');
    cy.get('#ct-amt').clear().type('150000.00');

    // Preenche os selects simples
    cy.get('#ct-pay').select('PIX'); 
    cy.get('#ct-st').select('SIGNED');

    // Seleciona a primeira venda disponível na lista vinda da API
    // Pegamos o 'value' da primeira <option> e usamos no select
    cy.get('#ct-sale').find('option').should('have.length.greaterThan', 0).first().then(($option) => {
        cy.get('#ct-sale').select($option.val() as string);
    });

    cy.get('#ct-notes').type('Contrato gerado via automação de testes Cypress.');

    cy.contains('button', 'Salvar Contrato').click();

    // Validações pós-salvamento
    cy.wait('@createContract').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.contains('Contrato criado!').should('be.visible');
    cy.get('app-modal').should('not.exist'); 
    
    // Aguarda a tela recarregar e busca o contrato criado
    cy.wait('@reloadContracts');
    cy.get('.branch-card').contains('CONT-2026-001').should('exist');
  });

  // --- 3. VIEW (Visualização de Detalhes) ---
  it('deve abrir o modal de visualização (View) com os dados bloqueados', () => {
    // Busca o botão de Visualizar dentro do primeiro Card
    cy.get('.branch-card').first().within(() => {
        cy.get('button').first().click({ force: true });
    });

    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Detalhes do Contrato').should('be.visible');

    // Verifica rótulos internos para garantir que a tela montou
    cy.contains('.form-label', 'Valor').should('exist');
    cy.contains('.form-label', 'Veículo').should('exist');

    cy.contains('button', 'Fechar').click();
    cy.get('app-modal').should('not.exist');
  });

  // --- 4. UPDATE (Edição pelo Modal) ---
  it('deve editar um contrato existente pelo modal', () => {
    cy.intercept('PUT', `${apiUrl}/*`).as('updateContractPut');
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateContractPatch');
    cy.intercept('GET', '**/api/sales*').as('getSales');
    cy.intercept('GET', `${apiUrl}*`).as('reloadContracts');

    // Clica no botão visual de Editar do primeiro card
    cy.get('.branch-card').first().contains('Editar').click({ force: true });

    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Editar Contrato').should('be.visible');

    cy.wait('@getSales');
    cy.get('#ct-sale').find('option').should('have.length.greaterThan', 0);
    
    // Como a sua edição envia apenas um Partial (status, deliveryDate e notes), vamos alterar isso
    cy.get('#ct-st').select('PENDING'); 
    cy.get('#ct-del').clear().type('2026-12-31');
    cy.get('#ct-notes').clear().type('Data de entrega adiada pelo cliente.');

    cy.contains('button', 'Salvar Contrato').click();

    // O seu Service usa this.http.patch para o update
    cy.wait(['@updateContractPatch', '@updateContractPut']);
    cy.contains('Contrato atualizado!').should('be.visible');
    
    cy.wait('@reloadContracts');
  });

  // --- 5. DELETE (Exclusão com SweetAlert) ---
  it('deve excluir um contrato após confirmação no SweetAlert', () => {
    cy.intercept('DELETE', `${apiUrl}/*`).as('deleteContract');
    cy.intercept('GET', `${apiUrl}*`).as('reloadContracts');

    // Pega a quantidade de cards iniciais
    cy.get('.branch-card').its('length').then((initialLength) => {
      
      // Clica em Excluir no primeiro card
      cy.get('.branch-card').first().contains('Excluir').click({ force: true });

      // Confirma no SweetAlert
      cy.contains('button', 'Sim').should('be.visible').click();

      cy.wait('@deleteContract').its('response.statusCode').should('be.oneOf', [200, 204]);
      cy.contains('Contrato excluído!').should('be.visible');

      cy.wait('@reloadContracts');

      // Valida se o card sumiu
      cy.get('body').then($body => {
        if ($body.find('.branch-card').length > 0) {
           cy.get('.branch-card').its('length').should('be.lessThan', initialLength);
        } else {
           cy.contains('Nenhum contrato encontrado').should('exist');
        }
      });
    });
  });

});