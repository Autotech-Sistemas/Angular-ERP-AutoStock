// cypress/e2e/customers.cy.ts

describe('Fluxo Completo de Clientes (CRUD e Tabs)', () => {
  const apiUrl = '**/api/customers';
  const apiAddressesUrl = '**/api/customers-address'; 

  // ─── Fixtures ─────────────────────────────────────────────────────────────
  const mockCustomer1 = {
    id: 'cust-1',
    name: 'João Silva',
    cpf: '111.111.111-11',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    birthDate: '1990-01-01T00:00:00',
    clientType: 'INDIVIDUAL',
    validCnh: true,
    registrationDate: '2026-01-01T00:00:00'
  };

  const mockCustomer2 = {
    id: 'cust-2',
    name: 'Empresa XYZ',
    cpf: '22.222.222/0001-22',
    email: 'contato@xyz.com',
    phone: '(22) 88888-8888',
    birthDate: '2015-05-15T00:00:00',
    clientType: 'CORPORATE',
    validCnh: false,
    registrationDate: '2026-02-01T00:00:00'
  };

  const mockAddress = {
    id: 'addr-1',
    street: 'Rua das Flores',
    number: 123,
    district: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01000-000'
  };

  const pagedCustomers = (items: any[]) => ({
    _embedded: { customerResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
  });

  const pagedAddresses = (items: any[]) => ({
    _embedded: { customerAddressResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 50, number: 0 },
  });

  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.loginAsAdmin();
    
    // Intercepta a listagem inicial
    cy.intercept('GET', `${apiUrl}?page*`, { body: pagedCustomers([mockCustomer1, mockCustomer2]) }).as('getCustomers');
    cy.visit('/clientes');
    cy.wait('@getCustomers');
  });

  // --- 1. RENDERIZAÇÃO E TABS ---
  describe('Renderização e Navegação de Tabs', () => {
    it('deve carregar a tela e exibir a aba de listagem', () => {
      cy.get('.page-title').contains('Clientes').should('be.visible');
      
      cy.get('button[role="tab"]').contains('Listagem').should('have.class', 'active');
      cy.get('button[role="tab"]').contains('Endereços').should('not.have.class', 'active');

      cy.get('table[aria-label="Lista de clientes"] tbody tr').should('have.length', 2);
      cy.contains('João Silva').should('be.visible');
      cy.contains('PF').should('be.visible');
      cy.contains('Válida').should('be.visible');
    });

    it('deve trocar para a aba de endereços e listar endereços', () => {
      cy.intercept('GET', `${apiAddressesUrl}*`, { body: pagedAddresses([mockAddress]) }).as('getAddresses');
      
      cy.get('button[role="tab"]').contains('Endereços').click();
      cy.wait('@getAddresses');
      
      cy.get('button[role="tab"]').contains('Endereços').should('have.class', 'active');
      cy.get('table[aria-label="Endereços de clientes"]').should('be.visible');
      cy.contains('Rua das Flores').should('be.visible');
      cy.contains('São Paulo').should('be.visible');
    });
  });

  // --- 2. FILTRO INTELIGENTE ---
  describe('Filtro de Clientes', () => {
    it('deve filtrar clientes no front-end pelo nome', () => {
      cy.get('input[type="search"]').type('João');
      
      cy.get('table[aria-label="Lista de clientes"] tbody tr').should('have.length', 1);
      cy.contains('João Silva').should('be.visible');
      cy.contains('Empresa XYZ').should('not.exist');
    });

    it('deve mostrar mensagem de "nenhum cliente" ao buscar algo inexistente', () => {
      cy.get('input[type="search"]').type('Extraterrestre');
      cy.contains('Nenhum cliente encontrado').should('be.visible');
    });
  });

  // --- 3. CREATE (Criação) ---
  describe('Criação de Clientes', () => {
    it('deve criar um novo cliente', () => {
      cy.intercept('POST', apiUrl, { statusCode: 201, body: { id: 'mock-123' } }).as('createCustomer');
      cy.intercept('GET', `${apiUrl}?page*`, { body: pagedCustomers([mockCustomer1, mockCustomer2, { ...mockCustomer1, name: 'Maria Lima' }]) }).as('reloadCustomers');

      cy.contains('button', 'Novo Cliente').click();
      cy.get('app-modal').filter(':visible').should('exist');

      cy.get('#cust-name').type('Maria Lima');
      cy.get('#cust-cpf').type('33333333333'); 
      cy.get('#cust-email').type('maria@email.com');
      cy.get('#cust-phone').type('11988887777');
      cy.get('#cust-birth').type('1995-10-20');
      cy.get('#cust-type').select('INDIVIDUAL');
      cy.get('#cust-cnh').check(); 

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();

      cy.wait('@createCustomer');
      cy.contains('Cliente cadastrado!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
      
      cy.wait('@reloadCustomers');
      cy.get('table[aria-label="Lista de clientes"] tbody tr').should('have.length', 3);
    });
  });

  // --- 4. VIEW (Visualização) ---
  describe('Visualização de Detalhes', () => {
    it('deve abrir modal de visualização', () => {
      cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions button').first().click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Detalhes do Cliente').should('be.visible');
      cy.contains('João Silva').should('be.visible');
      cy.contains('111.111.111-11').should('be.visible');
      cy.contains('Pessoa Física').should('be.visible');
    });
  });

  // --- 5. UPDATE (Edição) ---
  describe('Edição de Clientes', () => {
    it('deve editar um cliente existente', () => {
      cy.intercept('PATCH', `${apiUrl}/*`, { statusCode: 200 }).as('updateCustomerPatch');
      
      cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions').contains('button', 'Editar').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.get('#cust-name').should('have.value', 'João Silva'); 

      cy.get('#cust-name').clear().type('João Silva Editado');
      cy.get('#cust-cnh').uncheck();

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();

      cy.wait('@updateCustomerPatch');
      cy.contains('Cliente atualizado!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
    });
  });

  // --- 6. DELETE (Exclusão) ---
  describe('Exclusão', () => {
    it('deve excluir um cliente com SweetAlert', () => {
      cy.intercept('DELETE', `${apiUrl}/*`, { statusCode: 204 }).as('deleteCustomer');
      cy.intercept('GET', `${apiUrl}?page*`, { body: pagedCustomers([mockCustomer2]) }).as('reloadAfterDelete');

      cy.get('tbody tr').first().within(() => {
        cy.get('app-entity-actions').contains('button', 'Excluir').click({ force: true });
      });

      cy.contains('button', 'Sim').click();
      cy.wait('@deleteCustomer');
      cy.contains('Cliente excluído!').should('be.visible');
      cy.wait('@reloadAfterDelete');
      
      cy.get('table[aria-label="Lista de clientes"] tbody tr').should('have.length', 1);
    });

    it('deve excluir um endereço na aba Endereços', () => {
      // 1. Prepara e carrega a aba primeiro
      cy.intercept('GET', `${apiAddressesUrl}*`, { body: pagedAddresses([mockAddress]) }).as('getAddresses');
      
      cy.get('button[role="tab"]').contains('Endereços').click();
      cy.wait('@getAddresses');

      // 2. SÓ DEPOIS de carregar a lista original, dizemos para o Cypress como será a recarga vazia
      cy.intercept('DELETE', `${apiAddressesUrl}/*`, { statusCode: 204 }).as('deleteAddress');
      cy.intercept('GET', `${apiAddressesUrl}*`, { body: pagedAddresses([]) }).as('reloadEmptyAddresses');

      // 3. Executa a exclusão
      cy.get('table[aria-label="Endereços de clientes"] tbody tr').first().contains('Excluir').click();
      
      cy.contains('button', 'Sim').click();
      cy.wait('@deleteAddress');
      
      // 4. Espera o recarregamento com a nova regra de lista vazia
      cy.wait('@reloadEmptyAddresses');
      cy.contains('Endereço removido!').should('be.visible');
    });
  });

});