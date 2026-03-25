import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Vehicles } from './vehicles';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks dos serviços
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('VehiclesComponent', () => {
  let component: Vehicles;
  let fixture: ComponentFixture<Vehicles>;

  let vehicleServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    vehicleServiceMock = {
      getAll: vi.fn(),
      delete: vi.fn(),
    };

    toastServiceMock = { success: vi.fn(), error: vi.fn() };
    
    cacheServiceMock = { 
      has: vi.fn(), 
      get: vi.fn(), 
      set: vi.fn(), 
      invalidate: vi.fn() 
    };

    await TestBed.configureTestingModule({
      imports: [Vehicles, FormsModule],
      providers: [
        { provide: VehicleService, useValue: vehicleServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      // Ignora a inicialização real dos modais filhos (app-vehicle-form, etc) para focar apenas neste componente
      schemas: [NO_ERRORS_SCHEMA], 
    }).compileComponents();

    fixture = TestBed.createComponent(Vehicles);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento e Cache (load)', () => {
    const mockResponse = {
      _embedded: {
        vehicleResponseDTOList: [
          { id: '1', brand: 'Honda', model: 'Civic', type: 'CAR' }
        ]
      },
      page: { totalElements: 1 },
    };

    it('deve buscar dados da API e setar o cache quando não houver cache', () => {
      cacheServiceMock.has.mockReturnValue(false);
      vehicleServiceMock.getAll.mockReturnValue(of(mockResponse));

      component.load(0);

      expect(vehicleServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(component.items.length).toBe(1);
      expect(component.filtered.length).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('vehicles_page_0', expect.any(Object));
      expect(component.loading).toBe(false);
    });

    it('deve carregar do cache sem chamar a API', () => {
      const cachedData = { items: [{ id: '99', brand: 'Yamaha', type: 'MOTORCYCLE' }], total: 5 };
      cacheServiceMock.has.mockReturnValue(true);
      cacheServiceMock.get.mockReturnValue(cachedData);

      component.load(0);

      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(5);
    });
  });

  describe('Filtros (applyFilter)', () => {
    beforeEach(() => {
      component.items = [
        { id: '1', brand: 'Honda', model: 'Civic', color: 'Prata', type: 'CAR' },
        { id: '2', brand: 'Yamaha', model: 'MT-03', color: 'Azul', type: 'MOTORCYCLE' },
        { id: '3', brand: 'Ford', model: 'Ranger', color: 'Branca', type: 'TRUCK' }
      ] as any;
    });

    it('deve filtrar apenas pela query de texto (marca, modelo ou cor)', () => {
      component.searchQuery = 'Azul';
      component.typeFilter = '';
      component.onSearch();
      
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].model).toBe('MT-03');
    });

    it('deve filtrar apenas pelo tipo exato (Select)', () => {
      component.searchQuery = '';
      component.typeFilter = 'TRUCK';
      component.onSearch();

      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].brand).toBe('Ford');
    });

    it('deve cruzar os dois filtros (texto E tipo)', () => {
      // Retorna 0 porque a Ranger é TRUCK, mas a pesquisa é Honda
      component.searchQuery = 'Honda';
      component.typeFilter = 'TRUCK';
      component.onSearch();
      expect(component.filtered.length).toBe(0);

      // Retorna 1 porque o Civic é CAR e é da Honda
      component.typeFilter = 'CAR';
      component.onSearch();
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].model).toBe('Civic');
    });
  });

  describe('Abertura de Modais', () => {
    it('deve abrir modal de Criação', () => {
      component.openNew();
      expect(component.selectedVehicle).toBeNull();
      expect(component.modalOpen).toBe(true);
    });

    it('deve abrir modal de Edição', () => {
      const mockVeh = { id: '1' } as any;
      component.openEdit(mockVeh);
      expect(component.selectedVehicle).toEqual(mockVeh);
      expect(component.modalOpen).toBe(true);
    });

    it('deve abrir modal de Visualização', () => {
      const mockVeh = { id: '1' } as any;
      component.openView(mockVeh);
      expect(component.viewVehicle).toEqual(mockVeh);
      expect(component.viewModalOpen).toBe(true);
    });

    it('deve abrir modal de Imagens', () => {
      const mockVeh = { id: '1', brand: 'VW' } as any;
      component.openImages(mockVeh);
      // Deve criar uma cópia desconectada do objeto original ({ ...v })
      expect(component.imagesVehicle).toEqual(mockVeh);
      expect(component.imagesVehicle).not.toBe(mockVeh); 
      expect(component.imagesModalOpen).toBe(true);
    });
  });

  describe('Gerenciamento de Imagens Local', () => {
    it('deve atualizar a lista de imagens do veículo no array local e invalidar o cache', () => {
      // Estado inicial com um veículo que já possui 1 imagem
      component.items = [{ id: '1', images: [{ fileName: 'velha.jpg' }] }] as any;
      component.filtered = [...component.items];
      component.imagesVehicle = component.items[0]; // Veículo alvo da edição
      
      const newFiles = [
        { fileName: 'nova.jpg', fileDownloadUri: 'http://link', fileType: 'img', size: 100 }
      ];

      component.onImagesUpdated(newFiles);

      // Verifica se a imagem antiga foi mantida e a nova foi adicionada
      expect(component.items[0].images?.length).toBe(2);
      expect(component.items[0].images?.[1].fileName).toBe('nova.jpg');
      
      // O cache da página atual deve ser derrubado
      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('vehicles_page_0');
    });
  });

  describe('Ações Adicionais', () => {
    it('deve fechar modal e recarregar dados em onSaved()', () => {
      vi.spyOn(component, 'load').mockImplementation(() => {});
      component.modalOpen = true;

      component.onSaved();

      expect(component.modalOpen).toBe(false);
      expect(cacheServiceMock.invalidate).toHaveBeenCalled();
      expect(component.load).toHaveBeenCalledWith(0, true);
    });

    it('deve chamar API de delete após confirmação do SweetAlert', async () => {
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      vehicleServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete({ id: '99', brand: 'Fiat' } as any);

      expect(swalSpy).toHaveBeenCalled();
      expect(vehicleServiceMock.delete).toHaveBeenCalledWith('99');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Veículo excluído!');
    });

    it('não deve deletar se o usuário cancelar no SweetAlert', async () => {
      vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);
      await component.delete({ id: '99' } as any);
      expect(vehicleServiceMock.delete).not.toHaveBeenCalled();
    });
  });
});