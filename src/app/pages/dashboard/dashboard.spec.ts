import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
import { ApiService } from '../../services/api.service';
import { CacheService } from '../../services/cache.service';

describe('DashboardComponent', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  let apiServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    apiServiceMock = {
      get: vi.fn(),
      getAll: vi.fn(),
    };

    cacheServiceMock = {
      has: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]), // Necessário por causa do RouterLink no template
        { provide: ApiService, useValue: apiServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento de Dados (Sem Cache)', () => {
    it('deve buscar dados da API e alimentar os Signals quando o cache estiver vazio', () => {
      // Simula que não há nada no cache
      cacheServiceMock.has.mockReturnValue(false);

      // Simula as respostas de sucesso da API
      apiServiceMock.get.mockReturnValue(of({
        totalVehicles: 10, totalInventory: 5, totalSales: 15, totalCustomers: 20
      }));

      apiServiceMock.getAll.mockImplementation((url: string) => {
        if (url === '/appointments') {
          return of({ _embedded: { appointmentResponseDTOList: [{ id: 'a1' }] } });
        }
        if (url === '/branches') {
          return of({ _embedded: { branchResponseDTOList: [{ id: 'b1' }] } });
        }
        return of({});
      });

      component.ngOnInit();

      // Validações do Summary
      expect(apiServiceMock.get).toHaveBeenCalledWith('/dashboard/summary');
      const stats = component.stats();
      expect(stats.length).toBe(4);
      expect(stats[0].value).toBe(10); // Veículos
      expect(stats[1].value).toBe(5);  // Estoque
      expect(stats[2].value).toBe(15); // Vendas
      expect(stats[3].value).toBe(20); // Clientes
      expect(cacheServiceMock.set).toHaveBeenCalledWith('dash_summary', expect.any(Array));

      // Validações das listas
      expect(apiServiceMock.getAll).toHaveBeenCalledWith('/appointments', 0, 5);
      expect(component.appointments().length).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('dash_appointments', expect.any(Array));

      expect(apiServiceMock.getAll).toHaveBeenCalledWith('/branches', 0, 6);
      expect(component.branches().length).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('dash_branches', expect.any(Array));

      // Loading finaliza
      expect(component.loading()).toBe(false);
    });
  });

  describe('Carregamento de Dados (Com Cache)', () => {
    it('deve usar os dados do cache e NÃO chamar a API', () => {
      // Simula que TUDO está no cache
      cacheServiceMock.has.mockReturnValue(true);
      
      const cachedStats = [{ label: 'Veículos', value: 99, emoji: '🚗', sub: '', iconBg: '' }];
      const cachedApts = [{ id: 'cached-a1' }];
      const cachedBranches = [{ id: 'cached-b1' }];

      cacheServiceMock.get.mockImplementation((key: string) => {
        if (key === 'dash_summary') return cachedStats;
        if (key === 'dash_appointments') return cachedApts;
        if (key === 'dash_branches') return cachedBranches;
        return null;
      });

      component.ngOnInit();

      // Nenhuma chamada HTTP deve ter sido feita
      expect(apiServiceMock.get).not.toHaveBeenCalled();
      expect(apiServiceMock.getAll).not.toHaveBeenCalled();

      // Os signals devem estar com os dados do cache
      expect(component.stats()).toEqual(cachedStats);
      expect(component.appointments()).toEqual(cachedApts);
      expect(component.branches()).toEqual(cachedBranches);
      expect(component.loading()).toBe(false);
    });
  });

  describe('Tratamento de Erros (catchError)', () => {
    it('deve usar valores zerados e listas vazias se as requisições falharem', () => {
      cacheServiceMock.has.mockReturnValue(false);

      // Simula a API explodindo erro em todas as rotas
      apiServiceMock.get.mockReturnValue(throwError(() => new Error('Server Down')));
      apiServiceMock.getAll.mockReturnValue(throwError(() => new Error('Server Down')));

      component.ngOnInit();

      // O catchError deve segurar a bomba e retornar 0 para tudo
      const stats = component.stats();
      expect(stats[0].value).toBe(0);
      expect(stats[1].value).toBe(0);
      expect(stats[2].value).toBe(0);
      expect(stats[3].value).toBe(0);

      // As listas devem ficar vazias, sem quebrar o HTML
      expect(component.appointments()).toEqual([]);
      expect(component.branches()).toEqual([]);
      expect(component.loading()).toBe(false);
    });
  });

  describe('Refresh', () => {
    it('deve limpar o cache e forçar um novo carregamento da API ao chamar refresh()', () => {
      // Setup para o load pós-refresh
      apiServiceMock.get.mockReturnValue(of({}));
      apiServiceMock.getAll.mockReturnValue(of({}));

      component.refresh();

      // Verifica se o cache foi invalidado corretamente
      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('dash_summary');
      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('dash_appointments');
      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('dash_branches');

      // Verifica se a API foi chamada novamente (mesmo se o has() do mock retornar true, o forceRefresh ignora)
      expect(apiServiceMock.get).toHaveBeenCalled();
      expect(apiServiceMock.getAll).toHaveBeenCalledTimes(2);
    });
  });
});