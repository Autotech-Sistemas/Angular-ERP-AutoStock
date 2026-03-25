describe('Fluxo Completo de Agendamentos (CRUD com Spring Boot)', () => {
  const apiUrl = '**/api/appointments';

  beforeEach(() => {
    // 1. Configuração de tela (Desktop) para evitar sobreposição do menu
    cy.viewport(1366, 768);
    
    // 2. Intercepta a rota principal de agendamentos
    cy.intercept('GET', `${apiUrl}*`).as('getAppointments');
    
    // 3. Autenticação (Login do Admin)
    cy.visit('http://localhost:4200/'); 
    cy.get('#email').should('be.visible').type('admin@auto.com');
    cy.get('#password').type('Auto123@');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', 'login');

    // 4. Acesso à tela e aguardo do carregamento da tabela
    cy.visit('http://localhost:4200/agendamentos');
    cy.wait('@getAppointments');
  });

  // --- 1. READ (Listagem) ---
  it('deve carregar a tela, exibir a tabela e a paginação', () => {
    cy.get('.page-title').contains('Agendamentos').should('be.visible');
    cy.get('.data-table').should('be.visible');
    
    // Garante que há pelo menos uma linha renderizada no tbody
    cy.get('tbody tr').should('have.length.greaterThan', 0);
    
    // Verifica se o rodapé com o total de agendamentos apareceu
    cy.contains(/agendamento\(s\)/i).should('be.visible');
  });

  // --- 2. CREATE (Criação) ---
  it('deve criar um novo agendamento com sucesso', () => {
    cy.intercept('POST', apiUrl).as('createAppointment');
    cy.intercept('GET', '**/api/customers*').as('getCustomers');
    cy.intercept('GET', '**/api/sellers*').as('getSellers');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    cy.contains('button', 'Novo Agendamento').click();
    
    // Verifica a abertura do modal sem depender estritamente da tag HTML (h3, h2, etc)
    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Novo Agendamento').should('be.visible');

    // Espera o backend devolver as listas
    cy.wait('@getCustomers');
    cy.wait('@getSellers');

    // Garante a renderização das tags <option> antes de selecionar
    cy.get('#apt-cust').find('option').should('have.length.greaterThan', 0); 
    cy.get('#apt-cust').select('John Doe'); 
    
    cy.get('#apt-seller').find('option').should('have.length.greaterThan', 0);
    cy.get('#apt-seller').select('JANE SMITH');
    
    // Preenche tipo e data
    cy.get('#apt-type').select('TEST_DRIVE'); 
    cy.get('#apt-date').type('2026-10-15');

    cy.contains('button', 'Agendar').click();

    // Validações pós-salvamento
    cy.wait('@createAppointment').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.contains('Agendamento criado!').should('be.visible');
    cy.get('app-modal').should('not.exist'); 
    
    // Aguarda a tabela recarregar com o dado novo
    cy.wait('@reloadAppointments');
  });

  // --- 3. VIEW (Visualização de Detalhes) ---
  it('deve abrir o modal de visualização (View) com os dados bloqueados', () => {
    // Busca o primeiro botão da primeira linha de ações (geralmente o ícone de Olho)
    cy.get('tbody tr').first().within(() => {
        cy.get('button').first().click({ force: true });
    });

    // Verifica se o modal abriu com o título correto
    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Detalhes do Agendamento').should('be.visible');

    // Verifica rótulos internos
    cy.contains('.form-label', 'Cliente').should('exist');
    cy.contains('.form-label', 'Vendedor').should('exist');

    // Fecha o modal
    cy.contains('button', 'Fechar').click();
    cy.get('app-modal').should('not.exist');
  });

  // --- 4. UPDATE (Edição pelo Modal) ---
  it('deve editar um agendamento existente pelo modal', () => {
    cy.intercept('PUT', `${apiUrl}/*`).as('updateAppointmentPut');
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateAppointmentPatch');
    cy.intercept('GET', '**/api/customers*').as('getCustomers');
    cy.intercept('GET', '**/api/sellers*').as('getSellers');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    // Clica no botão visual de Editar
    cy.get('tbody tr').first().contains('Editar').click({ force: true });

    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Editar Agendamento').should('be.visible');

    cy.wait('@getCustomers');
    cy.wait('@getSellers');

    // Aguarda o bind do Angular
    cy.get('#apt-cust').find('option').should('have.length.greaterThan', 0);
    
    // Altera os dados
    cy.get('#apt-date').clear().type('2026-12-25');
    cy.get('#apt-type').select('NEGOTIATION_VISIT'); 

    cy.contains('button', 'Agendar').click();

    // Aceita tanto PUT quanto PATCH, dependendo da configuração da sua API
    cy.wait(['@updateAppointmentPut', '@updateAppointmentPatch']);
    cy.contains('Agendamento atualizado!').should('be.visible');
    
    cy.wait('@reloadAppointments');
  });

  // --- 5. UPDATE RÁPIDO (Mudança de Status na Tabela) ---
  it('deve alterar o status do agendamento diretamente no select da tabela', () => {
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateStatusPatch'); 
    cy.intercept('PUT', `${apiUrl}/*`).as('updateStatusPut'); 

    // Altera o status usando o VALUE da option
    cy.get('tbody tr').first().find('select').select('COMPLETED', { force: true });

    // Espera qualquer um dos métodos disparar
    cy.wait(['@updateStatusPatch', '@updateStatusPut']);
    cy.get('.toast').contains('Status atualizado!').should('be.visible');
  });

  // --- 6. DELETE (Exclusão com SweetAlert) ---
  it('deve excluir um agendamento após confirmação no SweetAlert', () => {
    cy.intercept('DELETE', `${apiUrl}/*`).as('deleteAppointment');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    cy.get('tbody tr').its('length').then((initialLength) => {
      
      // Clica no botão visual de Excluir da primeira linha
      cy.get('tbody tr').first().contains('Excluir').click({ force: true });

      // Confirmação no popup do SweetAlert
      cy.contains('button', 'Sim').should('be.visible').click();

      // Validações
      cy.wait('@deleteAppointment').its('response.statusCode').should('be.oneOf', [200, 204]);
      cy.contains('Agendamento excluído!').should('be.visible');

      cy.wait('@reloadAppointments');

      // Verifica dinamicamente se a linha sumiu da tabela ou se a tabela ficou vazia
      cy.get('body').then($body => {
        if ($body.find('tbody tr').length > 0 && !$body.text().includes('Nenhum agendamento')) {
           cy.get('tbody tr').its('length').should('be.lessThan', initialLength);
        } else {
           cy.contains('Nenhum agendamento cadastrado').should('exist');
        }
      });
    });
  });

});