import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inventory } from './inventory';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks dos serviços
import { InventoryService } from '../../services/inventory.service';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('InventoryComponent', () => {
  let component: Inventory;
  let fixture: ComponentFixture<Inventory>;

  let inventoryServiceMock: any;
  let vehicleServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    inventoryServiceMock = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    vehicleServiceMock = {
      getAll: vi.fn(),
    };

    toastServiceMock = { success: vi.fn(), error: vi.fn() };
    
    cacheServiceMock = { 
      has: vi.fn(), 
      get: vi.fn(), 
      set: vi.fn(), 
      invalidate: vi.fn() 
    };

    await TestBed.configureTestingModule({
      imports: [Inventory, ReactiveFormsModule],
      providers: [
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: VehicleService, useValue: vehicleServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Inventory);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Inicialização e Carregamento (load e loadVehicles)', () => {
    const mockInventoryResponse = {
      _embedded: {
        inventoryItemResponseDTOList: [
          { id: '1', licensePlate: 'ABC-1234', vehicle: { brand: 'VW', model: 'Gol' } },
          { id: '2', licensePlate: 'XYZ-9876', vehicle: { brand: 'Fiat', model: 'Uno' } }
        ]
      },
      page: { totalElements: 2 },
    };

    it('deve buscar dados da API se não houver cache na inicialização', () => {
      cacheServiceMock.has.mockReturnValue(false);
      inventoryServiceMock.getAll.mockReturnValue(of(mockInventoryResponse));
      vehicleServiceMock.getAll.mockReturnValue(of({ _embedded: { vehicleResponseDTOList: [] } }));

      component.ngOnInit();

      expect(inventoryServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(vehicleServiceMock.getAll).toHaveBeenCalled();
      expect(component.items.length).toBe(2);
      expect(component.filtered.length).toBe(2);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('inventory_page_0', expect.any(Object));
    });

    it('deve usar o cache de veículos se disponível', () => {
      cacheServiceMock.has.mockImplementation((key: string) => key === 'vehicles_all');
      cacheServiceMock.get.mockReturnValue([{ id: 'v1', brand: 'Ford' }]);
      inventoryServiceMock.getAll.mockReturnValue(of(mockInventoryResponse));

      component.loadVehicles();

      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.vehicles.length).toBe(1);
      expect(component.vehicles[0].brand).toBe('Ford');
    });
  });

  describe('Filtro de Busca (applyFilter)', () => {
    it('deve filtrar os itens do estoque corretamente', () => {
      component.items = [
        { id: '1', licensePlate: 'ABC-1234', vehicle: { brand: 'VW', model: 'Gol' } },
        { id: '2', licensePlate: 'XYZ-9876', vehicle: { brand: 'Fiat', model: 'Uno' } }
      ] as any;

      // Busca pela placa
      component.searchQuery = 'abc-1234';
      component.onSearch();
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].vehicle?.model).toBe('Gol');

      // Busca pela marca
      component.searchQuery = 'fiat';
      component.onSearch();
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].vehicle?.model).toBe('Uno');

      // Busca vazia
      component.searchQuery = '';
      component.onSearch();
      expect(component.filtered.length).toBe(2);
    });
  });

  describe('Cálculos Financeiros e Prévia', () => {
    it('deve calcular a prévia de venda corretamente na criação', () => {
      component.form.patchValue({ acquisitionPrice: 100000, profitMargin: 20 });
      component.calcPreview();
      
      // 100.000 + 20% = 120.000
      // formatCurrency cuidará do prefixo R$, nós garantimos que não é o traço vazio '—'
      expect(component.salePreview).not.toBe('—');
      expect(component.salePreview).toContain('120'); 
    });

    it('deve retornar "—" se a margem for zero ou nula', () => {
      component.form.patchValue({ acquisitionPrice: 100000, profitMargin: 0 });
      component.calcPreview();
      expect(component.salePreview).toBe('—');
    });

    it('deve calcular o preço de venda na tabela usando calcSalePrice', () => {
      const mockItem = { acquisitionPrice: 50000, profitMargin: 10 } as any;
      const result = component.calcSalePrice(mockItem);
      
      // 50.000 + 10% = 55.000
      expect(result).not.toBe('—');
      expect(result).toContain('55');
    });
  });

  describe('Abertura de Modais e Preenchimento de Form', () => {
    it('deve resetar o form em openNew()', () => {
      component.openNew();
      expect(component.modalOpen).toBe(true);
      expect(component.salePreview).toBe('—');
      expect(component.form.value.acquisitionPrice).toBe(0);
    });

    it('deve preencher o editForm e calcular prévia em openEdit()', () => {
      const mockItem = { 
        id: '99', 
        acquisitionPrice: 80000, 
        profitMargin: 15,
        stockEntryDate: '2026-03-25T00:00:00' 
      } as any;
      
      component.openEdit(mockItem);

      expect(component.editModalOpen).toBe(true);
      expect(component.selectedItem).toEqual(mockItem);
      expect(component.editForm.value.acquisitionPrice).toBe(80000);
      expect(component.editForm.value.stockEntryDate).toBe('2026-03-25');
      expect(component.salePreview).not.toBe('—');
    });

    it('deve preencher o item selecionado e abrir o viewModal em openView()', () => {
      const mockItem = { id: '99' } as any;
      component.openView(mockItem);
      expect(component.viewModalOpen).toBe(true);
      expect(component.selectedItem).toEqual(mockItem);
    });
  });

  describe('Ações de Salvar (save e saveEdit)', () => {
    it('não deve salvar criação se o formulário for inválido', () => {
      component.form.reset(); // Formulário vazio é inválido pois vehicleId é requerido
      component.save();
      expect(inventoryServiceMock.create).not.toHaveBeenCalled();
      expect(toastServiceMock.error).toHaveBeenCalled();
    });

    it('deve chamar create() ao salvar formulário válido', () => {
      component.form.patchValue({
        vehicleId: 'v1', acquisitionPrice: 50000, profitMargin: 10
      });

      inventoryServiceMock.create.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(inventoryServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        vehicleId: 'v1',
        acquisitionPrice: 50000,
        profitMargin: 10
      }));
      expect(toastServiceMock.success).toHaveBeenCalledWith('Item adicionado!');
      expect(component.modalOpen).toBe(false);
    });

    it('deve chamar update() enviando PATCH ao salvar edição', () => {
      component.selectedItem = { id: 'item123' } as any;
      component.editForm.patchValue({
        acquisitionPrice: 60000, profitMargin: 12, licensePlate: 'DEF-5678'
      });

      inventoryServiceMock.update.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.saveEdit();

      expect(inventoryServiceMock.update).toHaveBeenCalledWith('item123', expect.objectContaining({
        acquisitionPrice: 60000,
        profitMargin: 12,
        licensePlate: 'DEF-5678'
      }));
      expect(toastServiceMock.success).toHaveBeenCalledWith('Item atualizado com sucesso!');
      expect(component.editModalOpen).toBe(false);
    });
  });

  describe('Ação de Exclusão (delete)', () => {
    it('deve excluir o item se o usuário confirmar no SweetAlert', async () => {
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      inventoryServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete({ id: '99' } as any);

      expect(swalSpy).toHaveBeenCalled();
      expect(inventoryServiceMock.delete).toHaveBeenCalledWith('99');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Removido!');
    });

    it('NÃO deve excluir se o usuário cancelar no SweetAlert', async () => {
      vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);
      
      await component.delete({ id: '99' } as any);

      expect(inventoryServiceMock.delete).not.toHaveBeenCalled();
    });
  });
});