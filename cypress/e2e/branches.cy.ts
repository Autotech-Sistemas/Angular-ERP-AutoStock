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
  });

  // ── Renderização Inicial ───────────────────────────────────────────────────

  describe('Renderização Inicial', () => {
    it('deve exibir título e subtítulo da página', () => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('h2', 'Filiais').should('be.visible');
      cy.contains('Unidades e pontos de venda').should('be.visible');
    });

    it('deve exibir os botões "Atualizar" e "Nova Filial"', () => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.get('[aria-label="Atualizar lista de filiais"]').should('be.visible');
      cy.contains('button', 'Nova Filial').should('be.visible');
    });

    it('deve renderizar card para cada filial retornada pela API', () => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.get('[role="list"] [role="listitem"]').should('have.length', 2);
    });

    it('deve exibir informações corretas no card da filial', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('Main Branch').should('be.visible');
      cy.contains('Dealership').should('be.visible');
      cy.contains('John Doe').should('be.visible');
      cy.contains('(11) 91212-1212').should('be.visible');
      cy.contains('8:00 AM - 6:00 PM').should('be.visible');
      cy.contains('Paraná').should('be.visible');
      cy.contains('PR').should('be.visible');
    });

    it('deve exibir badge de status na filial', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('.badge', 'Active').should('be.visible');
    });

    it('deve exibir inicial do nome no avatar do card', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('M').should('be.visible'); // inicial de "Main Branch"
    });

    it('deve exibir skeleton loader durante carregamento', () => {
      cy.intercept('GET', `${API}**`, (req) => {
        req.on('response', (res) => {
          res.setDelay(500);
        });
        req.reply({ statusCode: 200, body: pagedResponse([mainBranch]) });
      }).as('slowGet');
      cy.visit('/branches');
      cy.get('.animate-pulse').should('have.length.greaterThan', 0);
      cy.wait('@slowGet');
      cy.get('.animate-pulse').should('not.exist');
    });

    it('deve exibir mensagem quando não há filiais', () => {
      interceptGetBranches([]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('Nenhuma filial cadastrada').should('be.visible');
    });
  });

  // ── Atualizar ──────────────────────────────────────────────────────────────

  describe('Botão Atualizar', () => {
    it('deve chamar API novamente ao clicar em Atualizar', () => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');

      interceptGetBranches([mainBranch], 'refresh');
      cy.get('[aria-label="Atualizar lista de filiais"]').click();
      cy.wait('@refresh');
      cy.get('[role="listitem"]').should('have.length', 1);
    });
  });

  // ── Modal Nova Filial ──────────────────────────────────────────────────────

  describe('Modal – Nova Filial', () => {
    beforeEach(() => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');
    });

    it('deve abrir modal ao clicar em "Nova Filial"', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.contains('[role="dialog"], app-modal', 'Nova Filial').should('be.visible');
    });

    it('modal deve conter seção "Dados da Filial" e "Endereço"', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.contains('DADOS DA FILIAL').should('be.visible');
      cy.contains('ENDEREÇO').should('be.visible');
    });

    it('deve exibir todos os campos do formulário', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.get('#br-name').should('be.visible');
      cy.get('#br-email').should('be.visible');
      cy.get('#br-phone').should('be.visible');
      cy.get('#br-mgr').should('be.visible');
      cy.get('#br-hours').should('be.visible');
      cy.get('#br-type').should('be.visible');
      cy.get('#br-st').should('be.visible');
      cy.get('#br-str').should('be.visible');
      cy.get('#br-num').should('be.visible');
      cy.get('#br-dist').should('be.visible');
      cy.get('#br-city').should('be.visible');
      cy.get('#br-state').should('be.visible');
      cy.get('#br-country').should('be.visible');
      cy.get('#br-cep').should('be.visible');
      cy.get('#br-comp').should('be.visible');
    });

    it('deve fechar modal ao clicar em "Cancelar"', () => {
      cy.contains('button', 'Nova Filial').click();
      cy.contains('button', 'Cancelar').click();
      cy.contains('Nova Filial').should('not.exist');
    });

    it('não deve chamar API se formulário estiver inválido', () => {
      cy.intercept('POST', API).as('create');
      cy.contains('button', 'Nova Filial').click();
      cy.contains('button', 'Salvar Filial').click();
      cy.get('@create.all').should('have.length', 0);
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
      cy.get('[role="listitem"]').should('have.length', 3);
    });

    it('deve exibir toast de erro quando criação falha', () => {
      cy.intercept('POST', API, { statusCode: 500, body: { message: 'Erro interno' } }).as(
        'createFail',
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
      cy.wait('@createFail');
      cy.contains('Erro').should('be.visible');
    });
  });

  // ── Modal Visualizar ───────────────────────────────────────────────────────

  describe('Modal – Visualizar Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
    });

    it('deve abrir modal de visualização ao clicar em "Visualizar"', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click();
      cy.contains('Detalhes da Filial').should('be.visible');
    });

    it('deve exibir todos os dados da filial no modal de visualização', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click();
      cy.contains('Main Branch').should('be.visible');
      cy.contains('mainbranch@example.com').should('be.visible');
      cy.contains('(11) 91212-1212').should('be.visible');
      cy.contains('John Doe').should('be.visible');
      cy.contains('8:00 AM - 6:00 PM').should('be.visible');
      cy.contains('Dealership').should('be.visible');
      cy.contains('Active').should('be.visible');
      cy.contains('Other Street').should('be.visible');
    });

    it('deve fechar modal ao clicar em "Fechar"', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click();
      cy.contains('button', 'Fechar').click();
      cy.contains('Detalhes da Filial').should('not.exist');
    });

    it('botão "Editar" no modal de view deve abrir modal de edição', () => {
      cy.get(`[aria-label="Visualizar filial Main Branch"]`).click();
      cy.contains('button', 'Editar').click();
      cy.contains('Editar Filial').should('be.visible');
    });
  });

  // ── Modal Editar ───────────────────────────────────────────────────────────

  describe('Modal – Editar Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
    });

    it('deve abrir modal de edição com dados pré-preenchidos', () => {
      cy.get(`[aria-label="Editar filial Main Branch"]`).click();
      cy.get('#br-name').should('have.value', 'Main Branch');
      cy.get('#br-email').should('have.value', 'mainbranch@example.com');
      cy.get('#br-mgr').should('have.value', 'John Doe');
    });

    it('deve atualizar filial ao salvar edição', () => {
      const updated = { ...mainBranch, name: 'Main Branch Atualizada' };
      cy.intercept('PUT', `${API}/branch-001`, { statusCode: 200, body: updated }).as('update');
      interceptGetBranches([updated], 'reloadAfterUpdate');

      cy.get(`[aria-label="Editar filial Main Branch"]`).click();
      cy.get('#br-name').clear().type('Main Branch Atualizada');
      cy.contains('button', 'Salvar Filial').click();
      cy.wait('@update');
      cy.wait('@reloadAfterUpdate');
      cy.contains('Filial atualizada!').should('be.visible');
    });

    it('deve exibir toast de erro ao falhar atualização', () => {
      cy.intercept('PUT', `${API}/branch-001`, {
        statusCode: 500,
        body: { message: 'Falha ao atualizar' },
      }).as('updateFail');
      cy.get(`[aria-label="Editar filial Main Branch"]`).click();
      cy.contains('button', 'Salvar Filial').click();
      cy.wait('@updateFail');
      cy.contains('Erro').should('be.visible');
    });
  });

  // ── Exclusão ───────────────────────────────────────────────────────────────

  describe('Exclusão de Filial', () => {
    beforeEach(() => {
      interceptGetBranches([mainBranch, secondBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
    });

    it('deve exibir diálogo de confirmação ao clicar em Excluir', () => {
      cy.on('window:confirm', () => true);
      cy.get(`[aria-label="Excluir filial Main Branch"]`).click();
      cy.get('.swal2-popup').should('be.visible');
      cy.contains('Excluir Main Branch?').should('be.visible');
    });

    it('deve excluir filial ao confirmar no Swal', () => {
      cy.intercept('DELETE', `${API}/branch-001`, { statusCode: 204 }).as('delete');
      interceptGetBranches([secondBranch], 'reloadAfterDelete');

      cy.get(`[aria-label="Excluir filial Main Branch"]`).click();
      cy.get('.swal2-confirm').click();
      cy.wait('@delete');
      cy.wait('@reloadAfterDelete');
      cy.contains('Filial excluída!').should('be.visible');
      cy.get('[role="listitem"]').should('have.length', 1);
    });

    it('não deve excluir filial ao cancelar no Swal', () => {
      cy.intercept('DELETE', `${API}/branch-001`).as('delete');
      cy.get(`[aria-label="Excluir filial Main Branch"]`).click();
      cy.get('.swal2-cancel').click();
      cy.get('@delete.all').should('have.length', 0);
      cy.get('[role="listitem"]').should('have.length', 2);
    });

    it('deve exibir toast de erro quando exclusão falha', () => {
      cy.intercept('DELETE', `${API}/branch-001`, {
        statusCode: 500,
        body: { message: 'Falha ao excluir' },
      }).as('deleteFail');
      cy.get(`[aria-label="Excluir filial Main Branch"]`).click();
      cy.get('.swal2-confirm').click();
      cy.wait('@deleteFail');
      cy.contains('Falha ao excluir').should('be.visible');
    });
  });

  // ── Acessibilidade ─────────────────────────────────────────────────────────

  describe('Acessibilidade', () => {
    it('botões de ação devem ter aria-labels descritivos', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.get('[aria-label="Visualizar filial Main Branch"]').should('exist');
      cy.get('[aria-label="Editar filial Main Branch"]').should('exist');
      cy.get('[aria-label="Excluir filial Main Branch"]').should('exist');
    });

    it('lista de filiais deve ter role="list"', () => {
      interceptGetBranches([mainBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.get('[role="list"]').should('exist');
    });

    it('cada card deve ter role="listitem"', () => {
      interceptGetBranches([mainBranch, secondBranch]);
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.get('[role="listitem"]').should('have.length', 2);
    });

    it('labels dos campos do formulário devem estar associados aos inputs', () => {
      interceptGetBranches();
      cy.visit('/branches');
      cy.wait('@getBranches');
      cy.contains('button', 'Nova Filial').click();
      cy.get('label[for="br-name"]').should('exist');
      cy.get('label[for="br-email"]').should('exist');
      cy.get('label[for="br-str"]').should('exist');
    });
  });

  // ── Cenários de Erro de Rede ───────────────────────────────────────────────

  describe('Erros de Rede', () => {
    it('deve se recuperar de falha na API sem travar a UI', () => {
      cy.intercept('GET', `${API}**`, {
        statusCode: 503,
        body: { message: 'Service Unavailable' },
      }).as('getBranchesFail');
      cy.visit('/branches');
      cy.wait('@getBranchesFail');
      cy.contains('Nenhuma filial cadastrada').should('be.visible');
      cy.get('button').should('not.be.disabled');
    });
  });
});
