// cypress/e2e/branches.cy.ts
// Testes de integração – Cypress
// Backend mock baseado em TestConfig.java (perfil dev)

const API = '/api/branches';

// ─── Fixtures (dados do TestConfig.java) ─────────────────────────────────────

const mockAddress = {
  street: 'Other Street',
  number: 456,
  complement: 'Apt 1A',
  district: 'Downtown',
  city: 'Paraná',
  state: 'PR',
  cep: '12345-678',
  country: 'Brazil',
};

const mainBranch = {
  id: 'branch-001',
  name: 'Main Branch',
  email: 'mainbranch@example.com',
  phoneNumber: '(11) 91212-1212',
  managerName: 'John Doe',
  openingHours: '8:00 AM - 6:00 PM',
  branchType: 'Dealership',
  status: 'Active',
  address: mockAddress,
};

const secondBranch = {
  id: 'branch-002',
  name: 'South Branch',
  email: 'south@example.com',
  phoneNumber: '(21) 91212-0000',
  managerName: 'Jane Smith',
  openingHours: '9:00 AM - 5:00 PM',
  branchType: 'Service Center',
  status: 'Active',
  address: { ...mockAddress, city: 'Rio de Janeiro', state: 'RJ' },
};

const pagedResponse = (items: object[]) => ({
  _embedded: { branchResponseDTOList: items },
  page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
});

// ─── Helper para interceptar GET padrão ───────────────────────────────────────

function interceptGetBranches(items = [mainBranch, secondBranch], alias = 'getBranches') {
  cy.intercept('GET', `${API}**`, { statusCode: 200, body: pagedResponse(items) }).as(alias);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Branches – Integração', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.viewport(1366, 768); // Padroniza o tamanho da tela
    cy.loginAsAdmin(); // Garante que não vai travar na tela de login
  });

  // ── Renderização Inicial ───────────────────────────────────────────────────

  describe('Renderização Inicial', () => {
    it('deve exibir título e subtítulo da página', () => {
      interceptGetBranches();
      cy.visit('/filiais'); // Ajuste a URL se no Angular estiver /branches
      cy.wait('@getBranches');
      cy.contains('h2', 'Filiais').should('be.visible');
      cy.contains('Unidades e pontos de venda').should('be.visible');
    });

    it('deve renderizar card para cada filial retornada pela API', () => {
      interceptGetBranches();
      cy.visit('/filiais');
      cy.wait('@getBranches');
      cy.get('[role="list"] [role="listitem"]').should('have.length', 2);
    });

    it('deve exibir inicial do nome no avatar do card', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/filiais');
      cy.wait('@getBranches');
      // Inicial de "Main Branch"
      cy.get('.branch-card').first().contains('M').should('be.visible');
    });

    it('deve exibir mensagem quando não há filiais', () => {
      interceptGetBranches([]);
      cy.visit('/filiais');
      cy.wait('@getBranches');
      cy.contains('Nenhuma filial cadastrada').should('be.visible');
    });
  });

  // ── Modal Nova Filial ──────────────────────────────────────────────────────

  describe('Modal – Nova Filial', () => {
    beforeEach(() => {
      interceptGetBranches();
      cy.visit('/filiais');
      cy.wait('@getBranches');
    });

    it('deve abrir modal ao clicar em "Nova Filial"', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.get('app-modal').should('be.visible');
      cy.contains('app-modal', 'Nova Filial').should('be.visible');
    });

    it('deve fechar modal ao clicar em "Cancelar"', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.contains('button', 'Cancelar').click();
      // Modais do Angular apenas ficam invisíveis, não saem do DOM
      cy.get('app-modal').should('not.be.visible');
    });

    it('deve criar nova filial com dados válidos', () => {
      cy.intercept('POST', API, {
        statusCode: 201,
        body: { id: 'branch-003', ...mainBranch, name: 'Filial Norte' },
      }).as('create');

      interceptGetBranches(
        [mainBranch, secondBranch, { ...mainBranch, id: 'branch-003', name: 'Filial Norte' }],
        'reloadAfterCreate',
      );

      cy.contains('button', 'Nova Filial').click();
      cy.get('#br-name').type('Filial Norte');
      cy.get('#br-email').type('norte@example.com');
      cy.get('#br-mgr').type('Ana Lima');
      cy.get('#br-hours').type('Seg-Sex 8h-18h');
      cy.get('#br-type').type('Concessionária');
      cy.get('#br-str').type('Av. Paulista');
      cy.get('#br-num').type('1000');
      cy.get('#br-dist').type('Bela Vista');
      cy.get('#br-city').type('São Paulo');
      cy.get('#br-state').type('SP');
      cy.get('#br-country').type('Brasil');

      cy.contains('button', 'Salvar Filial').click();
      cy.wait('@create');
      cy.wait('@reloadAfterCreate');

      cy.contains('Filial cadastrada!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
      cy.get('[role="listitem"]').should('have.length', 3);
    });
  });

  // ── Modal Visualizar ───────────────────────────────────────────────────────

  describe('Modal – Visualizar Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch]);
      cy.visit('/filiais');
      cy.wait('@getBranches');
    });

    it('deve abrir modal de visualização ao clicar em "Visualizar"', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click({ force: true });
      cy.contains('Detalhes da Filial').should('be.visible');
      cy.contains('Main Branch').should('be.visible');
      cy.contains('mainbranch@example.com').should('be.visible');
    });

    it('botão "Editar" no modal de view deve abrir modal de edição', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click({ force: true });
      cy.get('app-modal').filter(':visible').contains('button', 'Editar').click();
      cy.contains('Editar Filial').should('be.visible');
    });
  });

  // ── Modal Editar ───────────────────────────────────────────────────────────

  describe('Modal – Editar Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch]);
      cy.visit('/filiais');
      cy.wait('@getBranches');
    });

    it('deve atualizar filial ao salvar edição', () => {
      const updated = { ...mainBranch, name: 'Main Branch Atualizada' };

      cy.intercept('PATCH', `${API}/branch-001`, { statusCode: 200, body: updated }).as(
        'updatePatch',
      );
      interceptGetBranches([updated], 'reloadAfterUpdate');

      cy.get(`[aria-label="Editar filial Main Branch"]`).click({ force: true });
      cy.get('#br-name').clear().type('Main Branch Atualizada');
      cy.contains('button', 'Salvar Filial').click();

      cy.wait('@updatePatch');
      cy.wait('@reloadAfterUpdate');

      cy.contains('Filial atualizada!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
    });
  });

  // ── Exclusão ───────────────────────────────────────────────────────────────

  describe('Exclusão de Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch, secondBranch]);
      cy.visit('/filiais');
      cy.wait('@getBranches');
    });

    it('deve excluir filial ao confirmar no Swal', () => {
      cy.intercept('DELETE', `${API}/branch-001`, { statusCode: 204 }).as('delete');
      interceptGetBranches([secondBranch], 'reloadAfterDelete');

      cy.get(`[aria-label="Excluir filial Main Branch"]`).click({ force: true });
      cy.get('.swal2-confirm').click();

      cy.wait('@delete');
      cy.wait('@reloadAfterDelete');

      cy.contains('Filial excluída!').should('be.visible');
      cy.get('[role="listitem"]').should('have.length', 1);
    });
  });
});
