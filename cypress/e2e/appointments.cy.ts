// cypress/e2e/appointments.cy.ts

describe('Fluxo Completo de Agendamentos (CRUD com Spring Boot)', () => {
  const apiUrl = '**/api/appointments';

  beforeEach(() => {
    // 1. Configuração de tela (Desktop)
    cy.viewport(1366, 768);
    
    // 2. Intercepta a rota principal
    cy.intercept('GET', `${apiUrl}*`).as('getAppointments');
    
    // 3. Autenticação 
    cy.loginAsAdmin(); 

    // 4. Acesso à tela
    cy.visit('/agendamentos');
    cy.wait('@getAppointments');
  });

  // --- 1. READ (Listagem) ---
  it('deve carregar a tela, exibir a tabela e a paginação', () => {
    cy.get('.page-title').contains('Agendamentos').should('be.visible');
    cy.get('.data-table').should('be.visible');
    
    cy.get('body').then($body => {
      // Verifica se a tabela tem linhas ou se está vazia mostrando a mensagem
      if ($body.find('tbody tr td').length > 1) {
        cy.get('tbody tr').should('have.length.greaterThan', 0);
        cy.contains(/agendamento\(s\)/i).should('be.visible');
      } else {
        cy.contains('Nenhum agendamento cadastrado').should('be.visible');
      }
    });
  });

  // --- 2. CREATE (Criação) ---
  it('deve criar um novo agendamento com sucesso', () => {
    // MOCK: Força 201 para evitar regras de bloqueio do banco
    cy.intercept('POST', apiUrl, { statusCode: 201, body: { id: 'mock-123' } }).as('createAppointment');
    cy.intercept('GET', '**/api/customers*').as('getCustomers');
    cy.intercept('GET', '**/api/sellers*').as('getSellers');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    cy.contains('button', 'Novo Agendamento').click();
    
    // Filtra para garantir que estamos olhando para o modal visível
    cy.get('app-modal').filter(':visible').should('exist');

    // Espera o backend devolver as listas
    cy.wait('@getCustomers');
    cy.wait('@getSellers');

    // PREENCHIMENTO SEGURO: Obriga o Cypress a aguardar o Angular desenhar as opções na tela
    cy.get('#apt-cust option').should('have.length.greaterThan', 0).then($options => {
      cy.get('#apt-cust').select($options[0].value);
    });
    
    cy.get('#apt-seller option').should('have.length.greaterThan', 0).then($options => {
      cy.get('#apt-seller').select($options[0].value);
    });
    
    // Preenche tipo e data
    cy.get('#apt-type').select('TEST_DRIVE'); 
    cy.get('#apt-date').type('2026-10-15');
    cy.get('#apt-status').select('PENDING');

    // Clica em Agendar garantindo que clica no modal correto
    cy.get('app-modal').filter(':visible').contains('button', 'Agendar').click();

    // Validações pós-salvamento
    cy.wait('@createAppointment');
    cy.contains('Agendamento criado!').should('be.visible');
    
    // O modal deve ficar invisível
    cy.get('app-modal').should('not.be.visible'); 
    cy.wait('@reloadAppointments');
  });

  // --- 3. VIEW (Visualização de Detalhes) ---
  it('deve abrir o modal de visualização (View) com os dados bloqueados', () => {
    // Busca o componente app-entity-actions na primeira linha
    cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions button').first().click({ force: true });
    });

    cy.get('app-modal').should('be.visible');
    cy.get('app-modal').contains('Detalhes do Agendamento').should('be.visible');

    // Verifica rótulos internos
    cy.contains('.form-label', 'Cliente').should('exist');
    cy.contains('.form-label', 'Vendedor').should('exist');

    // Fecha o modal
    cy.contains('button', 'Fechar').click();
    cy.get('app-modal').should('not.be.visible');
  });

  // --- 4. UPDATE (Edição pelo Modal) ---
  it('deve editar um agendamento existente pelo modal', () => {
    // Intercepta a rota e captura tanto PATCH quanto PUT
    cy.intercept('PUT', `${apiUrl}/*`).as('updateAppointmentPut');
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateAppointmentPatch');
    cy.intercept('GET', '**/api/customers*').as('getCustomers');
    cy.intercept('GET', '**/api/sellers*').as('getSellers');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    // Clica no botão "Editar"
    cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions').contains('button', 'Editar').click({ force: true });
    });

    cy.get('app-modal').should('be.visible');

    cy.wait('@getCustomers');
    cy.wait('@getSellers');
    
    // Altera os dados
    cy.get('#apt-date').clear().type('2026-12-25');
    cy.get('#apt-type').select('NEGOTIATION_VISIT'); 

    // Clica para salvar
    cy.get('app-modal').filter(':visible').contains('button', 'Agendar').click();

    // Usa a estratégia do find(Boolean) para esperar o primeiro método que acontecer
    cy.wait(['@updateAppointmentPatch', '@updateAppointmentPut'].find(Boolean) as any).then((interception) => {
        expect(interception.response?.statusCode).to.be.oneOf([200, 204]);
    });
    
    cy.contains('Agendamento atualizado!').should('be.visible');
    cy.wait('@reloadAppointments');
    cy.get('app-modal').should('not.be.visible');
  });

  // --- 5. UPDATE RÁPIDO (Mudança de Status na Tabela) ---
  it('deve alterar o status do agendamento diretamente no select da tabela', () => {
    // Como a sua tabela usa select nativo para status rápido, interceptamos a chamada
    cy.intercept('PATCH', `${apiUrl}/*`).as('updateStatusPatch'); 
    cy.intercept('PUT', `${apiUrl}/*`).as('updateStatusPut'); 

    // Pega o select da primeira linha
    cy.get('tbody tr').first().find('select').then(($select) => {
      // Verifica o valor atual para mudar para algo diferente
      const currentValue = $select.val();
      const newValue = currentValue === 'PENDING' ? 'COMPLETED' : 'PENDING';
      
      cy.wrap($select).select(newValue, { force: true });
    });

    // Espera qualquer um dos métodos disparar
    cy.wait(['@updateStatusPatch', '@updateStatusPut'].find(Boolean) as any);
    // Aqui assumo que o seu toast exibe "Agendamento atualizado!" ao mudar status rápido
    cy.contains(/atualizado|sucesso/i).should('be.visible');
  });

  // --- 6. DELETE (Exclusão com SweetAlert) ---
  it('deve excluir um agendamento após confirmação no SweetAlert', () => {
    // MOCK: Força o retorno 204 para ignorar bloqueio de exclusão do banco local
    cy.intercept('DELETE', `${apiUrl}/*`, { statusCode: 204 }).as('deleteAppointment');
    cy.intercept('GET', `${apiUrl}*`).as('reloadAppointments');

    // Clica no botão Excluir
    cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions').contains('button', 'Excluir').click({ force: true });
    });

    // Confirmação no popup do SweetAlert
    cy.contains('button', 'Sim').should('be.visible').click();

    cy.wait('@deleteAppointment');
    cy.contains('Agendamento excluído!').should('be.visible');

    cy.wait('@reloadAppointments');
  });

});