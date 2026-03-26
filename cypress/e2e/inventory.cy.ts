// cypress/e2e/inventory.cy.ts

describe('Fluxo Completo de Estoque (CRUD e Modais Específicos)', () => {
  // CORREÇÃO 1: Rota exata do backend
  const apiUrl = '**/api/inventory-items*'; 
  const vehiclesApiUrl = '**/api/vehicles*';

  // ─── Fixtures (Dados Mockados) ─────────────────────────────────────────────
  
  const mockVehicle = {
    id: 'veh-1',
    brand: 'Toyota',
    model: 'Corolla XEI',
    manufactureYear: 2023,
    modelYear: 2024,
    color: 'Prata',
    fuelType: 'FLEX',
    images: [{ downloadUri: 'https://via.placeholder.com/600x300' }]
  };

  const mockInventoryItem1 = {
    id: 'inv-1',
    vehicle: mockVehicle,
    licensePlate: 'ABC-1234',
    chassis: '9BWZZZ...',
    supplier: 'Leilão Local',
    acquisitionPrice: 85000.00,
    profitMargin: 15.0,
    stockEntryDate: '2026-03-01T00:00:00'
  };

  const mockInventoryItem2 = {
    id: 'inv-2',
    vehicle: { brand: 'Honda', model: 'Civic' },
    licensePlate: 'XYZ-9876',
    acquisitionPrice: 90000.00,
    profitMargin: 20.0,
    stockEntryDate: '2026-03-10T00:00:00'
  };

  const pagedInventory = (items: any[]) => ({
    _embedded: { inventoryItemResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
  });

  const pagedVehicles = (items: any[]) => ({
    _embedded: { vehicleResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 200, number: 0 },
  });

  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.loginAsAdmin();
    
    // CORREÇÃO 2: Intercepta a lista de veículos já no load da página (ngOnInit)
    cy.intercept('GET', apiUrl, { body: pagedInventory([mockInventoryItem1, mockInventoryItem2]) }).as('getInventory');
    cy.intercept('GET', vehiclesApiUrl, { body: pagedVehicles([mockVehicle]) }).as('getVehicles');

    cy.visit('/estoque'); 
    cy.wait(['@getInventory', '@getVehicles']); 
  });

  // --- 1. RENDERIZAÇÃO E LISTAGEM ---
  describe('Renderização e Listagem', () => {
    it('deve carregar a tela e exibir a tabela de estoque', () => {
      cy.get('.page-title').contains('Estoque').should('be.visible');
      
      cy.get('table[aria-label="Lista de estoque"] tbody tr').should('have.length', 2);
      cy.contains('Toyota Corolla XEI').should('be.visible');
      cy.contains('ABC-1234').should('be.visible');
      cy.contains('15%').should('be.visible');
      cy.contains('Honda Civic').should('be.visible');
    });
  });

  // --- 2. FILTRO INTELIGENTE ---
  describe('Filtro do Estoque', () => {
    it('deve filtrar itens no front-end pelo veículo ou placa', () => {
      cy.get('input[type="search"]').type('Toyota');
      
      cy.get('table[aria-label="Lista de estoque"] tbody tr').should('have.length', 1);
      cy.contains('Toyota Corolla XEI').should('be.visible');
      cy.contains('Honda Civic').should('not.exist');

      cy.get('input[type="search"]').clear().type('XYZ-9876');
      cy.contains('Honda Civic').should('be.visible');
    });

    it('deve mostrar mensagem de lista vazia ao não encontrar itens', () => {
      cy.get('input[type="search"]').type('Ferrari');
      cy.contains('Nenhum item no estoque').should('be.visible');
    });
  });

  // --- 3. CREATE (Criação de Item) ---
  describe('Criação de Item no Estoque', () => {
    it('deve criar um novo item de estoque', () => {
      cy.intercept('POST', apiUrl, { statusCode: 201, body: { id: 'mock-new' } }).as('createItem');
      
      cy.intercept('GET', apiUrl, { body: pagedInventory([mockInventoryItem1, mockInventoryItem2, { ...mockInventoryItem1, id: 'inv-3', licensePlate: 'NOVA-111' }]) }).as('reloadInventory');

      cy.contains('button', 'Novo Item').click();
      
      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('app-modal', 'Item de Estoque').should('be.visible');

      cy.get('#inv-veh option').should('have.length.greaterThan', 1).then($options => {
        cy.get('#inv-veh').select($options[1].value);
      });
      
      cy.get('#inv-plate').type('NOVA-111');
      cy.get('#inv-chassis').type('CHASSI-TESTE');
      cy.get('#inv-sup').type('Concessionária Local');
      cy.get('#inv-acq').clear().type('100000');
      cy.get('#inv-margin').clear().type('20');
      cy.get('#inv-entry').type('2026-03-20');

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();

      cy.wait('@createItem');
      cy.contains('Item adicionado!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
      
      cy.wait('@reloadInventory');
      cy.get('table[aria-label="Lista de estoque"] tbody tr').should('have.length', 3);
    });
  });

  // --- 4. VIEW (Visualização de Detalhes) ---
  describe('Visualização de Detalhes do Item', () => {
    it('deve abrir modal de visualização e mostrar resumo financeiro', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Detalhes do Estoque').should('be.visible');
      
      cy.contains('Toyota Corolla XEI').should('be.visible');
      cy.contains('ABC-1234').should('be.visible');
      cy.contains('Leilão Local').should('be.visible');
      
      // CORREÇÃO 3: Rola a barra de scroll interna do modal para baixo até o Resumo Financeiro aparecer!
      cy.contains('Resumo Financeiro').scrollIntoView().should('be.visible');

      cy.get('app-modal').filter(':visible').contains('button', 'Fechar').click();
      cy.get('app-modal').should('not.be.visible');
    });

    it('botão "Editar Item" no modal de detalhes deve transitar para o modal de edição', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').contains('button', 'Editar Item').click();

      cy.contains('app-modal', 'Editar Item do Estoque').should('be.visible');
      cy.get('#e-plate').should('have.value', 'ABC-1234');
    });
  });

  // --- 5. UPDATE (Edição de Item) ---
  describe('Edição de Item de Estoque', () => {
    it('deve editar um item preenchendo os campos específicos de edição (#e-)', () => {
      cy.intercept('PATCH', `${apiUrl}/*`, { statusCode: 200 }).as('updateItemPatch');
      cy.intercept('PUT', `${apiUrl}/*`, { statusCode: 200 }).as('updateItemPut');
      
      cy.get('table tbody tr').first().within(() => {
        cy.contains('button', 'Editar').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('app-modal', 'Editar Item do Estoque').should('be.visible');

      cy.get('#e-plate').should('have.value', 'ABC-1234');

      cy.get('#e-plate').clear().type('ABC-9999');
      cy.get('#e-margin').clear().type('25');

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar Alterações').click();

      cy.wait(['@updateItemPatch', '@updateItemPut'].find(Boolean) as any);
      
      cy.contains('Item atualizado com sucesso!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
    });
  });

  // --- 6. DELETE (Exclusão) ---
  describe('Exclusão de Item', () => {
    it('deve excluir um item confirmando no SweetAlert', () => {
      cy.intercept('DELETE', `${apiUrl}/*`, { statusCode: 204 }).as('deleteItem');
      cy.intercept('GET', apiUrl, { body: pagedInventory([mockInventoryItem2]) }).as('reloadAfterDelete');

      cy.get('table tbody tr').first().within(() => {
        cy.contains('button', 'Excluir').click({ force: true });
      });

      cy.get('.swal2-popup').should('be.visible');
      cy.contains('button', 'Sim').click();
      
      cy.wait('@deleteItem');
      cy.contains('Removido!').should('be.visible');
      cy.wait('@reloadAfterDelete');
      
      cy.get('table[aria-label="Lista de estoque"] tbody tr').should('have.length', 1);
    });
  });

});