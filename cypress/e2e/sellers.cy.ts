// cypress/e2e/sellers.cy.ts

describe('Fluxo Completo de Vendedores (CRUD)', () => {
  const apiUrl = '**/api/sellers';

  // ─── Fixtures ─────────────────────────────────────────────────────────────
  const mockSeller1 = {
    id: 'seller-1',
    name: 'Carlos Souza',
    email: 'carlos@vendas.com',
    phone: '(11) 91111-1111',
    salary: 4500,
    commissionRate: 5,
    hireDate: '2024-03-01T00:00:00',
    enabled: true,
  };

  const mockSeller2 = {
    id: 'seller-2',
    name: 'Fernanda Lima',
    email: 'fernanda@vendas.com',
    phone: null,
    salary: 3800,
    commissionRate: 3.5,
    hireDate: '2025-07-15T00:00:00',
    enabled: false,
  };

  const pagedSellers = (items: any[]) => ({
    _embedded: { sellerResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
  });

  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.loginAsAdmin();

    cy.intercept('GET', `${apiUrl}*`, { body: pagedSellers([mockSeller1, mockSeller2]) }).as('getSellers');
    cy.visit('/vendedores');
    cy.wait('@getSellers');
  });

  // ─── 1. RENDERIZAÇÃO ───────────────────────────────────────────────────────
  describe('Renderização da Listagem', () => {
    it('deve exibir título e botões de cabeçalho', () => {
      cy.get('.page-title').contains('Vendedores').should('be.visible');
      cy.contains('button', 'Atualizar').should('be.visible');
      cy.contains('button', 'Novo Vendedor').should('be.visible');
    });

    it('deve renderizar a tabela com as colunas corretas', () => {
      cy.get('table[aria-label="Lista de vendedores"]').should('be.visible');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Nome');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Email');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Telefone');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Salário');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Comissão');
      cy.get('table[aria-label="Lista de vendedores"] thead th').should('contain', 'Status');
    });

    it('deve listar os vendedores corretamente', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').should('have.length', 2);
      cy.contains('Carlos Souza').should('be.visible');
      cy.contains('carlos@vendas.com').should('be.visible');
      cy.contains('Fernanda Lima').should('be.visible');
      cy.contains('fernanda@vendas.com').should('be.visible');
    });

    it('deve exibir telefone como "—" quando ausente', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').eq(1).contains('—');
    });

    it('deve exibir badge "Ativo" para vendedor habilitado', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get('.badge-green').contains('Ativo').should('be.visible');
      });
    });

    it('deve exibir badge "Inativo" para vendedor desabilitado', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').eq(1).within(() => {
        cy.get('.badge-red').contains('Inativo').should('be.visible');
      });
    });

    it('deve exibir a comissão formatada com "%"', () => {
      cy.contains('5%').should('be.visible');
      cy.contains('3.5%').should('be.visible');
    });

    it('deve exibir total de vendedores no rodapé', () => {
      cy.contains('2 vendedor(es)').should('be.visible');
    });

    it('deve exibir "Nenhum vendedor cadastrado" quando a lista está vazia', () => {
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSellers([]) }).as('getSellersEmpty');
      cy.reload();
      cy.wait('@getSellersEmpty');
      cy.contains('Nenhum vendedor cadastrado').should('be.visible');
    });
  });

  // ─── 2. VISUALIZAÇÃO ───────────────────────────────────────────────────────
  describe('Visualização de Detalhes', () => {
    it('deve abrir o modal de detalhes ao clicar em visualizar', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Visualizar vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Detalhes do Vendedor').should('be.visible');
      cy.contains('Carlos Souza').should('be.visible');
      cy.contains('carlos@vendas.com').should('be.visible');
      cy.contains('(11) 91111-1111').should('be.visible');
      cy.contains('Ativo').should('be.visible');
    });

    it('deve exibir o status "Inativo" corretamente no modal de detalhes', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').eq(1).within(() => {
        cy.get(`[aria-label="Visualizar vendedor Fernanda Lima"]`).click({ force: true });
      });

      cy.get('app-modal').filter(':visible').within(() => {
        cy.contains('Inativo').should('be.visible');
      });
    });

    it('deve fechar o modal ao clicar em "Fechar"', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Visualizar vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.get('app-modal').filter(':visible').contains('button', 'Fechar').click();
      cy.get('app-modal[title="Detalhes do Vendedor"]').should('not.be.visible');
    });

    it('deve navegar do modal de detalhes para o modal de edição', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Visualizar vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.get('app-modal').filter(':visible').contains('button', 'Editar').click();
      cy.contains('Editar Vendedor').should('be.visible');
    });
  });

  // ─── 3. CRIAÇÃO ────────────────────────────────────────────────────────────
  describe('Criação de Vendedor', () => {
    beforeEach(() => {
      cy.contains('button', 'Novo Vendedor').click();
      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Novo Vendedor').should('be.visible');
    });

    it('deve abrir o modal de novo vendedor com campos vazios', () => {
      cy.get('#sel-name').should('have.value', '');
      cy.get('#sel-email').should('have.value', '');
      cy.get('#sel-pass').should('have.value', '');
      cy.get('#sel-hire').should('have.value', '');
    });

    it('deve exigir campo de senha ao criar novo vendedor', () => {
      // Senha é obrigatória apenas na criação
      cy.get('#sel-pass').should('be.visible');
    });

    it('deve criar um novo vendedor com sucesso', () => {
      cy.intercept('POST', apiUrl, { statusCode: 201, body: { id: 'seller-new' } }).as('createSeller');
      cy.intercept('GET', `${apiUrl}*`, {
        body: pagedSellers([mockSeller1, mockSeller2, { ...mockSeller1, id: 'seller-new', name: 'Ricardo Alves' }]),
      }).as('reloadSellers');

      cy.get('#sel-name').type('Ricardo Alves');
      cy.get('#sel-email').type('ricardo@vendas.com');
      cy.get('#sel-pass').type('senha123');
      cy.get('#sel-phone').type('11977776666');
      cy.get('#sel-hire').type('2026-01-10');
      cy.get('#sel-sal').clear().type('5000');
      cy.get('#sel-comm').clear().type('4.5');

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();

      cy.wait('@createSeller');
      cy.contains('Vendedor cadastrado!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');

      cy.wait('@reloadSellers');
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').should('have.length', 3);
    });

    it('deve fechar o modal ao clicar em "Cancelar"', () => {
      cy.get('app-modal').filter(':visible').contains('button', 'Cancelar').click();
      cy.get('app-modal').should('not.be.visible');
    });
  });

  // ─── 4. EDIÇÃO ─────────────────────────────────────────────────────────────
  describe('Edição de Vendedor', () => {
    beforeEach(() => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Editar vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Editar Vendedor').should('be.visible');
    });

    it('deve pré-preencher o formulário com dados do vendedor', () => {
      cy.get('#sel-name').should('have.value', 'Carlos Souza');
      cy.get('#sel-email').should('have.value', 'carlos@vendas.com');
      cy.get('#sel-phone').should('have.value', '(11) 91111-1111');
      cy.get('#sel-sal').should('have.value', '4500');
      cy.get('#sel-comm').should('have.value', '5');
    });

    it('não deve exibir campo de senha como obrigatório na edição', () => {
      // Na edição, a senha não tem validator obrigatório — o campo existe mas é opcional
      cy.get('#sel-pass').should('exist');
      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();
      // Não deve mostrar erro de validação para senha
      cy.get('#sel-pass').should('not.have.class', 'border-red-500');
    });

    it('deve salvar a edição com PUT/PATCH e exibir toast de sucesso', () => {
      cy.intercept('PATCH', `**/api/sellers/**`, { statusCode: 200 }).as('updateSeller');
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSellers([mockSeller1, mockSeller2]) }).as('reloadSellers');

      cy.get('#sel-name').clear().type('Carlos Souza Editado');
      cy.get('#sel-sal').clear().type('5200');
      cy.get('#sel-comm').clear().type('6');

      cy.get('app-modal').filter(':visible').contains('button', 'Salvar').click();

      cy.wait('@updateSeller');
      cy.contains('Vendedor atualizado!').should('be.visible');
      cy.get('app-modal').should('not.be.visible');
    });

    it('deve fechar o modal ao clicar em "Cancelar"', () => {
      cy.get('app-modal').filter(':visible').contains('button', 'Cancelar').click();
      cy.get('app-modal').should('not.be.visible');
    });
  });

  // ─── 5. EXCLUSÃO ───────────────────────────────────────────────────────────
  describe('Exclusão de Vendedor', () => {
    it('deve excluir um vendedor após confirmação no SweetAlert', () => {
      cy.intercept('DELETE', `**/api/sellers/**`, { statusCode: 204 }).as('deleteSeller');
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSellers([mockSeller2]) }).as('reloadAfterDelete');

      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Excluir vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.contains('Excluir Carlos Souza?').should('be.visible');
      cy.contains('button', 'Sim').click();

      cy.wait('@deleteSeller');
      cy.contains('Vendedor excluído!').should('be.visible');

      cy.wait('@reloadAfterDelete');
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').should('have.length', 1);
    });

    it('deve cancelar a exclusão ao clicar em "Não" no SweetAlert', () => {
      cy.get('table[aria-label="Lista de vendedores"] tbody tr').first().within(() => {
        cy.get(`[aria-label="Excluir vendedor Carlos Souza"]`).click({ force: true });
      });

      cy.contains('Excluir Carlos Souza?').should('be.visible');
      cy.contains('button', 'Não').click();

      cy.get('table[aria-label="Lista de vendedores"] tbody tr').should('have.length', 2);
    });
  });

  // ─── 6. ATUALIZAR (REFRESH) ────────────────────────────────────────────────
  describe('Botão Atualizar', () => {
    it('deve recarregar a lista ao clicar em "Atualizar"', () => {
      cy.intercept('GET', `${apiUrl}*`, {
        body: pagedSellers([
          mockSeller1,
          mockSeller2,
          { ...mockSeller1, id: 'seller-3', name: 'Novo Vendedor' },
        ]),
      }).as('refreshSellers');

      cy.contains('button', 'Atualizar').click();
      cy.wait('@refreshSellers');

      cy.get('table[aria-label="Lista de vendedores"] tbody tr').should('have.length', 3);
      cy.contains('Novo Vendedor').should('be.visible');
    });
  });
});