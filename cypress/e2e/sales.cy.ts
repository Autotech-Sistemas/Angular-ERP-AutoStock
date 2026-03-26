// cypress/e2e/sales.cy.ts

describe('Fluxo Completo de Vendas (CRUD e Formulário Multi-Step)', () => {
  const apiUrl = '**/api/sales';
  const apiCustomersUrl = '**/api/customers';
  const apiSellersUrl = '**/api/sellers';
  const apiInventoryUrl = '**/api/inventory';

  // ─── Fixtures ─────────────────────────────────────────────────────────────
  const mockCustomer = {
    id: 'cust-1',
    name: 'João Silva',
    cpf: '111.111.111-11',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
  };

  const mockSeller = {
    id: 'seller-1',
    name: 'Carlos Vendedor',
    email: 'carlos@vendas.com',
    phone: '(11) 91111-1111',
  };

  const mockInventoryItem = {
    id: 'inv-1',
    licensePlate: 'ABC-1234',
    chassis: 'CHS-000111',
    stockExitDate: null,
    vehicle: {
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2022,
      salePrice: 95000,
      images: [],
    },
  };

  const mockSale1 = {
    id: 'sale-1',
    receipt: 'REC-2026-001',
    invoice: 'NF-001',
    saleDate: '2026-01-10T00:00:00',
    paymentMethod: 'CASH',
    grossAmount: 95000,
    appliedDiscount: 5000,
    netAmount: 90000,
    installmentsNumber: null,
    customer: mockCustomer,
    seller: mockSeller,
    inventoryItem: mockInventoryItem,
  };

  const mockSale2 = {
    id: 'sale-2',
    receipt: 'REC-2026-002',
    invoice: null,
    saleDate: '2026-02-15T00:00:00',
    paymentMethod: 'INSTALLMENTS_WITHOUT_INTEREST',
    grossAmount: 120000,
    appliedDiscount: 0,
    netAmount: 120000,
    installmentsNumber: 36,
    customer: { ...mockCustomer, id: 'cust-2', name: 'Empresa XYZ', cpf: '22.222.222/0001-22' },
    seller: mockSeller,
    inventoryItem: {
      ...mockInventoryItem,
      id: 'inv-2',
      licensePlate: 'XYZ-9999',
      vehicle: { brand: 'Honda', model: 'Civic', manufactureYear: 2023, salePrice: 120000, images: [] },
    },
  };

  // ─── Helpers de paginação ─────────────────────────────────────────────────
  const pagedSales = (items: any[]) => ({
    _embedded: { saleResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
  });

  const pagedCustomers = (items: any[]) => ({
    _embedded: { customerResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 200, number: 0 },
  });

  const pagedSellers = (items: any[]) => ({
    _embedded: { sellerResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 200, number: 0 },
  });

  const pagedInventory = (items: any[]) => ({
    _embedded: { inventoryItemResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 500, number: 0 },
  });

  // ─── Helper: abre o modal de edição da primeira linha ─────────────────────
  // Registra os intercepts ANTES do clique e aguarda as respostas antes de
  // continuar — evita que o modal seja assertado antes do Angular terminar
  // de popular o editForm com os dados da venda selecionada.
  const openEditModal = () => {
    cy.intercept('GET', `${apiCustomersUrl}*`, { body: pagedCustomers([mockCustomer]) }).as('getCustomers');
    cy.intercept('GET', `${apiSellersUrl}*`, { body: pagedSellers([mockSeller]) }).as('getSellers');

    cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
      cy.contains('button', 'Editar').click({ force: true });
    });

    // Espera as duas requests de dependência terminarem
    cy.wait('@getCustomers');
    cy.wait('@getSellers');

    // Confirma que o modal está visível E que o form já tem o valor inicial
    cy.get('app-modal[title="Editar Venda"]').filter(':visible').should('exist');
    cy.get('#e-pay').should('be.visible').and('have.value', 'CASH');
  };

  // ─── Setup global ─────────────────────────────────────────────────────────
  beforeEach(() => {
    cy.loginAsAdmin();

    cy.intercept('GET', `${apiUrl}*`, { body: pagedSales([mockSale1, mockSale2]) }).as('getSales');
    cy.visit('/vendas');
    cy.wait('@getSales');
  });

  // ─── 1. RENDERIZAÇÃO ───────────────────────────────────────────────────────
  describe('Renderização da Listagem', () => {
    it('deve exibir título, campo de busca e botões de ação', () => {
      cy.get('.page-title').contains('Vendas').should('be.visible');
      cy.get('input[type="text"]').should('have.attr', 'placeholder').and('include', 'Buscar');
      cy.contains('button', 'Atualizar').should('be.visible');
      cy.contains('button', 'Nova Venda').should('be.visible');
    });

    it('deve renderizar a tabela com as colunas corretas', () => {
      cy.get('table[aria-label="Histórico de vendas"]').should('be.visible');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Data');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Recibo');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Cliente');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Veículo');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Valor Líquido');
      cy.get('table[aria-label="Histórico de vendas"] thead th').should('contain', 'Pagamento');
    });

    it('deve listar as vendas mockadas corretamente', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 2);
      cy.contains('REC-2026-001').should('be.visible');
      cy.contains('João Silva').should('be.visible');
      cy.contains('Toyota').should('be.visible');
      cy.contains('ABC-1234').should('be.visible');
      cy.contains('REC-2026-002').should('be.visible');
      cy.contains('Empresa XYZ').should('be.visible');
    });

    it('deve exibir badge de método de pagamento com label correto', () => {
      cy.contains('À Vista').should('be.visible');
      cy.contains('Parcelado (Sem Juros)').should('be.visible');
    });

    it('deve exibir parcelas formatadas com "x"', () => {
      cy.contains('36x').should('be.visible');
    });

    it('deve exibir "—" quando não há parcelas', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.contains('—').should('exist');
      });
    });

    it('deve exibir total de vendas no rodapé', () => {
      cy.contains('2 venda(s) registrada(s)').should('be.visible');
    });

    it('deve exibir "Nenhuma venda encontrada" quando a lista está vazia', () => {
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSales([]) }).as('getSalesEmpty');
      cy.reload();
      cy.wait('@getSalesEmpty');
      cy.contains('Nenhuma venda encontrada').should('be.visible');
    });
  });

  // ─── 2. FILTRO ─────────────────────────────────────────────────────────────
  describe('Filtro de Vendas', () => {
    it('deve filtrar por nome do cliente', () => {
      cy.get('input[type="text"]').type('João');
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 1);
      cy.contains('João Silva').should('be.visible');
      cy.contains('Empresa XYZ').should('not.exist');
    });

    it('deve filtrar por número do recibo', () => {
      cy.get('input[type="text"]').type('REC-2026-002');
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 1);
      cy.contains('REC-2026-002').should('be.visible');
    });

    it('deve filtrar por placa do veículo', () => {
      cy.get('input[type="text"]').type('XYZ-9999');
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 1);
      cy.contains('Honda').should('be.visible');
    });

    it('deve exibir "Nenhuma venda encontrada" ao buscar termo inexistente', () => {
      cy.get('input[type="text"]').type('Extraterrestre123');
      cy.contains('Nenhuma venda encontrada').should('be.visible');
    });
  });

  // ─── 3. VISUALIZAÇÃO ───────────────────────────────────────────────────────
  describe('Visualização de Detalhes', () => {
    it('deve abrir o modal de detalhes ao clicar no botão de visualizar', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').should('exist');
      cy.contains('Detalhes da Venda').should('be.visible');
      cy.contains('REC-2026-001').should('be.visible');
      cy.contains('João Silva').should('be.visible');
      cy.contains('Carlos Vendedor').should('be.visible');
      cy.contains('Toyota').should('be.visible');
      cy.contains('Corolla').should('be.visible');
    });

    it('deve exibir o resumo financeiro corretamente no modal de detalhes', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.contains('Valor Bruto do Veículo').scrollIntoView().should('be.visible');
      cy.contains('Desconto Concedido').scrollIntoView().should('be.visible');
      cy.contains('Valor Líquido Recebido').scrollIntoView().should('be.visible');
    });

    it('deve exibir dados do cliente e vendedor em cards separados', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.contains('Comprador (Cliente)').should('be.visible');
      cy.contains('Responsável (Vendedor)').should('be.visible');
    });

    it('deve fechar o modal ao clicar em "Fechar Recibo"', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').contains('button', 'Fechar Recibo').click();
      cy.get('app-modal[title="Detalhes da Venda"]').should('not.be.visible');
    });

    it('deve navegar do modal de detalhes para o modal de edição', () => {
      cy.intercept('GET', `${apiCustomersUrl}*`, { body: pagedCustomers([mockCustomer]) }).as('getCustomers');
      cy.intercept('GET', `${apiSellersUrl}*`, { body: pagedSellers([mockSeller]) }).as('getSellers');

      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[title="Ver detalhes"]').click({ force: true });
      });

      cy.get('app-modal').filter(':visible').contains('button', 'Editar Venda').click();
      cy.wait('@getCustomers');
      cy.wait('@getSellers');
      cy.contains('Editar Venda').should('be.visible');
    });
  });

  // ─── 4. NOVA VENDA – FORMULÁRIO MULTI-STEP ─────────────────────────────────
  describe('Criação de Nova Venda (Formulário Multi-Step)', () => {
    beforeEach(() => {
      cy.intercept('GET', `${apiCustomersUrl}*`, { body: pagedCustomers([mockCustomer]) }).as('getCustomers');
      cy.intercept('GET', `${apiSellersUrl}*`, { body: pagedSellers([mockSeller]) }).as('getSellers');
      cy.intercept('GET', `${apiInventoryUrl}*`, { body: pagedInventory([mockInventoryItem]) }).as('getInventory');

      cy.contains('button', 'Nova Venda').click();

      cy.wait('@getCustomers');
      cy.wait('@getSellers');
      cy.wait('@getInventory');

      cy.get('app-modal').filter(':visible').should('exist');
    });

    it('deve abrir o modal de nova venda no passo 1', () => {
      cy.contains('Registrar Nova Venda').should('be.visible');
      cy.contains('1. Vínculos').should('be.visible');
      cy.contains('Veículo no Estoque').should('be.visible');
      cy.contains('Cliente Comprador').should('be.visible');
      cy.contains('Vendedor Responsável').should('be.visible');
    });

    it('deve impedir avanço do passo 1 sem preencher campos obrigatórios', () => {
      cy.contains('button', 'Continuar').click();
      cy.contains('1. Vínculos').should('be.visible');
      cy.get('#s-date').should('be.visible');
    });

    it('deve selecionar veículo via picker e avançar para passo 2', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').should('exist');
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();

      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();

      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();

      cy.get('#s-date').type('2026-03-15');

      cy.contains('button', 'Continuar').click();
      cy.contains('2. Pagamento').should('be.visible');
      cy.get('#s-pay').should('be.visible');
    });

    it('deve exibir campo de parcelas ao selecionar método parcelado', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      cy.get('#s-pay').select('INSTALLMENTS_WITHOUT_INTEREST');
      cy.get('#s-inst').should('be.visible');
    });

    it('deve ocultar campo de parcelas para pagamento à vista', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      cy.get('#s-pay').select('CASH');
      cy.get('#s-inst').should('not.exist');
    });

    it('deve calcular valor líquido em tempo real ao informar desconto', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      cy.get('#s-gross').clear().type('100000');
      cy.get('#s-disc').clear().type('10000');
      cy.contains('R$ 90.000').should('be.visible');
    });

    it('deve avançar para o passo 3 e exibir campos de documentos', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      cy.get('#s-gross').clear().type('95000');
      cy.contains('button', 'Continuar').click();

      cy.contains('3. Documentos').should('be.visible');
      cy.get('#s-rcpt').should('be.visible');
      cy.get('#s-invc').should('be.visible');
    });

    it('deve voltar ao passo anterior ao clicar em "Voltar"', () => {
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      cy.contains('button', 'Voltar').click();
      cy.contains('1. Vínculos').should('be.visible');
      cy.get('#s-date').should('be.visible');
    });

    it('deve salvar nova venda com sucesso ao completar os 3 passos', () => {
      cy.intercept('POST', apiUrl, { statusCode: 201, body: { id: 'sale-new' } }).as('createSale');
      cy.intercept('GET', `${apiUrl}*`, {
        body: pagedSales([mockSale1, mockSale2, { ...mockSale1, id: 'sale-new', receipt: 'REC-2026-003' }]),
      }).as('reloadSales');

      // Passo 1
      cy.contains('Selecionar veículo').click();
      cy.get('app-record-picker').filter(':visible').contains('Toyota Corolla').click();
      cy.contains('Selecionar cliente').click();
      cy.get('app-record-picker').filter(':visible').contains('João Silva').click();
      cy.contains('Selecionar vendedor').click();
      cy.get('app-record-picker').filter(':visible').contains('Carlos Vendedor').click();
      cy.get('#s-date').type('2026-03-15');
      cy.contains('button', 'Continuar').click();

      // Passo 2
      cy.get('#s-gross').clear().type('95000');
      cy.get('#s-disc').clear().type('5000');
      cy.contains('button', 'Continuar').click();

      // Passo 3
      cy.get('#s-rcpt').type('REC-2026-003');
      cy.get('#s-invc').type('NF-003');

      cy.contains('button', 'Confirmar Venda').click();

      cy.wait('@createSale');
      cy.contains('Venda registrada com sucesso!').should('be.visible');
      cy.get('app-modal[title="Registrar Nova Venda"]').should('not.be.visible');

      cy.wait('@reloadSales');
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 3);
    });

    it('deve fechar o modal ao clicar em "Cancelar"', () => {
      cy.contains('button', 'Cancelar').click();
      cy.get('app-modal[title="Registrar Nova Venda"]').should('not.be.visible');
    });
  });

  // ─── 5. EDIÇÃO ─────────────────────────────────────────────────────────────
  describe('Edição de Venda', () => {
    // Cada teste chama openEditModal() individualmente.
    // Isso garante que cy.intercept() seja sempre registrado ANTES do clique
    // e que cy.wait() confirme o carregamento antes de qualquer asserção no form.

    it('deve abrir o modal de edição com dados pré-preenchidos', () => {
      openEditModal();

      cy.contains('Editar Venda').should('be.visible');
      cy.contains('REC-2026-001').should('be.visible');
      cy.get('#e-pay').should('have.value', 'CASH');
      cy.get('#e-disc').should('have.value', '5000');
      cy.get('#e-net').should('have.value', '90000');
    });

    it('deve exibir campo de parcelas ao trocar para método parcelado', () => {
      openEditModal();

      cy.get('#e-pay').select('INSTALLMENTS_WITH_INTEREST');
      cy.get('#e-inst').should('be.visible');
    });

    it('deve ocultar campo de parcelas ao trocar para PIX', () => {
      openEditModal();

      cy.get('#e-pay').select('PIX');
      cy.get('#e-inst').should('not.exist');
    });

    it('deve calcular o valor líquido ao alterar desconto', () => {
      openEditModal();

      // Confirma que o form está hidratado com os dados de mockSale1
      // antes de interagir (grossAmount=95000, appliedDiscount=5000)
      cy.get('#e-disc').should('have.value', '5000');

      // Altera o desconto e dispara o evento (input) que o Angular escuta
      cy.get('#e-disc').clear().type('10000').trigger('input');

      // grossAmount=95000 − appliedDiscount=10000 → netAmount=85000
      cy.get('#e-net').should('have.value', '85000');
    });

    it('deve salvar a edição com PATCH e exibir toast de sucesso', () => {
      // Registra o intercept do PATCH antes de abrir o modal
      cy.intercept('PATCH', '**/api/sales/**', { statusCode: 200 }).as('patchSale');
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSales([mockSale1, mockSale2]) }).as('reloadSales');

      openEditModal();

      cy.get('#e-pay').select('PIX');
      cy.get('#e-disc').clear().type('2000').trigger('input');
      cy.get('#e-invc').clear().type('NF-UPDATED');

      cy.get('app-modal[title="Editar Venda"]')
        .filter(':visible')
        .contains('button', 'Salvar Alterações')
        .click();

      cy.wait('@patchSale');
      cy.contains('Venda atualizada com sucesso!').should('be.visible');
      cy.get('app-modal[title="Editar Venda"]').should('not.be.visible');
    });

    it('deve fechar o modal ao clicar em "Cancelar"', () => {
      openEditModal();

      cy.get('app-modal[title="Editar Venda"]')
        .filter(':visible')
        .contains('button', 'Cancelar')
        .click();
      cy.get('app-modal[title="Editar Venda"]').should('not.be.visible');
    });
  });

  // ─── 6. EXCLUSÃO ───────────────────────────────────────────────────────────
  describe('Exclusão (Cancelamento) de Venda', () => {
    it('deve cancelar uma venda após confirmação no SweetAlert', () => {
      cy.intercept('DELETE', `${apiUrl}/*`, { statusCode: 204 }).as('deleteSale');
      cy.intercept('GET', `${apiUrl}*`, { body: pagedSales([mockSale2]) }).as('reloadAfterDelete');

      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[aria-label*="Excluir venda de João Silva"]').click({ force: true });
      });

      cy.contains('Cancelar Venda').should('be.visible');
      cy.contains('REC-2026-001').should('be.visible');
      cy.contains('button', 'Sim, cancelar venda').click();

      cy.wait('@deleteSale');
      cy.contains('Venda cancelada com sucesso!').should('be.visible');

      cy.wait('@reloadAfterDelete');
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 1);
    });

    it('deve não excluir a venda ao clicar em "Voltar" no SweetAlert', () => {
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').first().within(() => {
        cy.get('button[aria-label*="Excluir venda de João Silva"]').click({ force: true });
      });

      cy.contains('button', 'Voltar').click();
      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 2);
    });
  });

  // ─── 7. ATUALIZAR (REFRESH) ────────────────────────────────────────────────
  describe('Botão Atualizar', () => {
    it('deve recarregar a lista ao clicar em "Atualizar"', () => {
      cy.intercept('GET', `${apiUrl}*`, {
        body: pagedSales([mockSale1, mockSale2, { ...mockSale1, id: 'sale-3', receipt: 'REC-2026-003' }]),
      }).as('refreshSales');

      cy.contains('button', 'Atualizar').click();
      cy.wait('@refreshSales');

      cy.get('table[aria-label="Histórico de vendas"] tbody tr').should('have.length', 3);
    });
  });
});