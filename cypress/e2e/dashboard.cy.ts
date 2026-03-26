// cypress/e2e/dashboard.cy.ts

describe('Dashboard – Visão Geral', () => {
  const summaryApiUrl = '**/api/dashboard/summary';
  const appointmentsApiUrl = '**/api/appointments*';
  const branchesApiUrl = '**/api/branches*';

  // ─── Fixtures (Dados Mockados) ─────────────────────────────────────────────
  
  const mockSummary = {
    totalVehicles: 150,
    totalInventory: 42,
    totalSales: 38,
    totalCustomers: 850
  };

  const mockAppointments = [
    {
      id: 'apt-1',
      date: '2026-03-25T14:30:00',
      appointmentType: 'TEST_DRIVE',
      appointmentStatus: 'PENDING',
      customer: { name: 'João Silva' }
    },
    {
      id: 'apt-2',
      date: '2026-03-26T10:00:00',
      appointmentType: 'NEGOTIATION_VISIT',
      appointmentStatus: 'COMPLETED',
      customer: { name: 'Empresa XYZ' }
    }
  ];

  const mockBranches = [
    {
      id: 'br-1',
      name: 'Matriz Centro',
      status: 'Ativo',
      address: { city: 'São Paulo', state: 'SP' }
    },
    {
      id: 'br-2',
      name: 'Filial Sul',
      status: 'Em Manutenção',
      address: { city: 'Curitiba', state: 'PR' }
    }
  ];

  // Helpers para simular a resposta paginada do backend
  const pagedAppointments = (items: any[]) => ({
    _embedded: { appointmentResponseDTOList: items },
  });

  const pagedBranches = (items: any[]) => ({
    _embedded: { branchResponseDTOList: items },
  });

  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.loginAsAdmin();
  });

  // --- 1. RENDERIZAÇÃO E CARDS DE RESUMO ---
  describe('Renderização e Resumo Geral', () => {
    it('deve carregar a tela e os 4 cards de estatísticas', () => {
      // Intercepta as 3 requisições
      cy.intercept('GET', summaryApiUrl, { body: mockSummary }).as('getSummary');
      cy.intercept('GET', appointmentsApiUrl, { body: pagedAppointments([]) }).as('getAppointments');
      cy.intercept('GET', branchesApiUrl, { body: pagedBranches([]) }).as('getBranches');

      cy.visit('/dashboard'); 

      cy.wait(['@getSummary', '@getAppointments', '@getBranches']);

      // Verifica cabeçalho
      cy.get('.page-title').contains('Dashboard').should('be.visible');

      // Verifica os 4 cards focando especificamente na classe .stat-card para ignorar o menu lateral
      cy.get('.stat-card').should('have.length', 4);
      
      cy.get('.stat-card').filter(':contains("Veículos")').contains('150').should('be.visible');
      cy.get('.stat-card').filter(':contains("Estoque")').contains('42').should('be.visible');
      cy.get('.stat-card').filter(':contains("Vendas")').contains('38').should('be.visible');
      cy.get('.stat-card').filter(':contains("Clientes")').contains('850').should('be.visible');
    });
  });

  // --- 2. LISTAS PREENCHIDAS ---
  describe('Listas de Agendamentos e Filiais', () => {
    beforeEach(() => {
      cy.intercept('GET', summaryApiUrl, { body: mockSummary }).as('getSummary');
      cy.intercept('GET', appointmentsApiUrl, { body: pagedAppointments(mockAppointments) }).as('getAppointments');
      cy.intercept('GET', branchesApiUrl, { body: pagedBranches(mockBranches) }).as('getBranches');
      
      cy.visit('/dashboard');
      cy.wait(['@getSummary', '@getAppointments', '@getBranches']);
    });

    it('deve listar os agendamentos recentes corretamente', () => {
      cy.get('[aria-label="Agendamentos recentes"]').within(() => {
        cy.contains('Agendamentos Recentes').should('be.visible');
        cy.contains('João Silva').should('be.visible');
        cy.contains('Empresa XYZ').should('be.visible');
        
        // Verifica o link de redirecionamento aceitando a URL base do localhost
        cy.get('a[routerLink="/agendamentos"]').should('have.attr', 'href').and('include', '/agendamentos');
      });
    });

    it('deve listar as filiais ativas corretamente', () => {
      cy.get('[aria-label="Filiais ativas"]').within(() => {
        cy.contains('Filiais').should('be.visible');
        cy.contains('Matriz Centro').should('be.visible');
        cy.contains('São Paulo, SP').should('be.visible');
        cy.contains('Filial Sul').should('be.visible');
        
        // Verifica o link de redirecionamento aceitando a URL base do localhost
        cy.get('a[routerLink="/filiais"]').should('have.attr', 'href').and('include', '/filiais');
      });
    });
  });

  // --- 3. LISTAS VAZIAS ---
  describe('Tratamento de Listas Vazias', () => {
    it('deve exibir mensagem apropriada quando não há dados recentes', () => {
      cy.intercept('GET', summaryApiUrl, { body: mockSummary }).as('getSummary');
      
      // Simulamos que as listas vieram vazias da API
      cy.intercept('GET', appointmentsApiUrl, { body: pagedAppointments([]) }).as('getAppointmentsEmpty');
      cy.intercept('GET', branchesApiUrl, { body: pagedBranches([]) }).as('getBranchesEmpty');

      cy.visit('/dashboard');
      cy.wait(['@getSummary', '@getAppointmentsEmpty', '@getBranchesEmpty']);

      cy.get('[aria-label="Agendamentos recentes"]').contains('Nenhum agendamento cadastrado').should('be.visible');
      cy.get('[aria-label="Filiais ativas"]').contains('Nenhuma filial cadastrada').should('be.visible');
    });
  });

  // --- 4. BOTÃO DE ATUALIZAR ---
  describe('Ações da Tela', () => {
    it('deve chamar as APIs novamente ao clicar no botão Atualizar', () => {
      cy.intercept('GET', summaryApiUrl, { body: mockSummary }).as('getSummary');
      cy.intercept('GET', appointmentsApiUrl, { body: pagedAppointments([]) }).as('getAppointments');
      cy.intercept('GET', branchesApiUrl, { body: pagedBranches([]) }).as('getBranches');

      cy.visit('/dashboard');
      cy.wait(['@getSummary', '@getAppointments', '@getBranches']);

      // Prepara os interceptadores para a recarga
      cy.intercept('GET', summaryApiUrl, { body: { ...mockSummary, totalVehicles: 999 } }).as('getSummaryReload');
      cy.intercept('GET', appointmentsApiUrl, { body: pagedAppointments(mockAppointments) }).as('getAppointmentsReload');
      cy.intercept('GET', branchesApiUrl, { body: pagedBranches(mockBranches) }).as('getBranchesReload');

      // Clica em atualizar
      cy.contains('button', 'Atualizar').click();

      // Espera as 3 chamadas novamente
      cy.wait(['@getSummaryReload', '@getAppointmentsReload', '@getBranchesReload']);

      // Verifica se a tela reagiu com os dados novos restringindo aos cards
      cy.get('.stat-card').filter(':contains("Veículos")').contains('999').should('be.visible');
      cy.contains('João Silva').should('be.visible'); 
      cy.contains('Matriz Centro').should('be.visible'); 
    });
  });

});