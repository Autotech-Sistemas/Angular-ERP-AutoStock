import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Customers } from './customers';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks dos serviços
import { CustomerService } from '../../services/customer.service';
import { CustomerAddressService } from '../../services/customer-address.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('CustomersComponent', () => {
  let component: Customers;
  let fixture: ComponentFixture<Customers>;

  let customerServiceMock: any;
  let addressServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    customerServiceMock = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    addressServiceMock = {
      getAll: vi.fn(),
      delete: vi.fn(),
    };

    toastServiceMock = { success: vi.fn(), error: vi.fn() };
    cacheServiceMock = { has: vi.fn(), get: vi.fn(), set: vi.fn(), invalidate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Customers, ReactiveFormsModule],
      providers: [
        { provide: CustomerService, useValue: customerServiceMock },
        { provide: CustomerAddressService, useValue: addressServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Customers);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento e Filtro (load e search)', () => {
    const mockResponse = {
      _embedded: {
        customerResponseDTOList: [
          { id: '1', name: 'Raphael', cpf: '111.111.111-11', email: 'raphael@test.com' },
          { id: '2', name: 'John Doe', cpf: '222.222.222-22', email: 'john@test.com' }
        ]
      },
      page: { totalElements: 2 },
    };

    it('deve buscar clientes da API, salvar no cache e aplicar filtro inicial', () => {
      cacheServiceMock.has.mockReturnValue(false);
      customerServiceMock.getAll.mockReturnValue(of(mockResponse));

      component.load(0);

      expect(customerServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(component.items.length).toBe(2);
      expect(component.filtered.length).toBe(2); // Filtro inicial deve conter todos
      expect(cacheServiceMock.set).toHaveBeenCalledWith('customers_page_0', expect.any(Object));
      expect(cacheServiceMock.set).toHaveBeenCalledWith('customers_all', expect.any(Array));
    });

    it('deve filtrar os clientes corretamente baseado na busca (onSearch)', () => {
      // Alimenta os items localmente
      component.items = mockResponse._embedded.customerResponseDTOList as any;
      
      // Busca pelo nome
      component.searchQuery = 'rapha';
      component.onSearch();
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].name).toBe('Raphael');

      // Busca pelo CPF
      component.searchQuery = '222.222';
      component.onSearch();
      expect(component.filtered.length).toBe(1);
      expect(component.filtered[0].name).toBe('John Doe');

      // Busca vazia (deve retornar todos)
      component.searchQuery = '';
      component.onSearch();
      expect(component.filtered.length).toBe(2);
    });
  });

  describe('Abas e Endereços (Tabs)', () => {
    it('deve trocar a aba ativa e buscar endereços se for a aba address', () => {
      addressServiceMock.getAll.mockReturnValue(of({
        _embedded: { customerAddressResponseDTOList: [{ id: 'a1', street: 'Rua X' }] }
      }));
      cacheServiceMock.has.mockReturnValue(false);

      component.switchTab('address');

      expect(component.activeTab).toBe('address');
      expect(addressServiceMock.getAll).toHaveBeenCalled();
      expect(component.addresses.length).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('customers_addresses', expect.any(Array));
    });

    it('deve trocar a aba ativa sem buscar endereços se for a aba list', () => {
      component.switchTab('list');
      expect(component.activeTab).toBe('list');
      expect(addressServiceMock.getAll).not.toHaveBeenCalled();
    });
  });

  describe('Máscaras de Input', () => {
    it('deve aplicar máscara de CPF e atualizar o formulário', () => {
      const inputEvent = { target: { value: '12345678901' } } as unknown as Event;
      
      component.onCpf(inputEvent);

      expect((inputEvent.target as HTMLInputElement).value).toBe('123.456.789-01');
      expect(component.form.value.cpf).toBe('123.456.789-01');
    });

    it('deve aplicar máscara de Telefone e atualizar o formulário', () => {
      const inputEvent = { target: { value: '11987654321' } } as unknown as Event;
      
      component.onPhone(inputEvent);

      expect((inputEvent.target as HTMLInputElement).value).toBe('(11) 98765-4321');
      expect(component.form.value.phone).toBe('(11) 98765-4321');
    });
  });

  describe('Modais e Formulário', () => {
    it('deve resetar o form e abrir modal em openNew()', () => {
      component.openNew();
      expect(component.editId).toBe('');
      expect(component.modalOpen).toBe(true);
      expect(component.form.value.clientType).toBe('INDIVIDUAL');
      expect(component.form.value.validCnh).toBe(false);
    });

    it('deve preencher o form e abrir modal em openEdit()', () => {
      const mockCustomer = { id: '99', name: 'Maria', clientType: 'CORPORATE' } as any;
      component.openEdit(mockCustomer);

      expect(component.editId).toBe('99');
      expect(component.modalOpen).toBe(true);
      expect(component.form.value.name).toBe('Maria');
      expect(component.form.value.clientType).toBe('CORPORATE');
    });
  });

  describe('Salvar Dados (save)', () => {
    it('não deve salvar se formulário for inválido', () => {
      component.form.reset();
      component.save();
      expect(customerServiceMock.create).not.toHaveBeenCalled();
    });

    it('deve criar um cliente novo', () => {
      component.editId = '';
      component.form.patchValue({
        name: 'Raphael', cpf: '123', email: 'a@a.com', phone: '111', 
        birthDate: '2000-01-01', clientType: 'INDIVIDUAL', validCnh: true
      });

      customerServiceMock.create.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(customerServiceMock.create).toHaveBeenCalled();
      expect(toastServiceMock.success).toHaveBeenCalledWith('Cliente cadastrado!');
      expect(component.modalOpen).toBe(false);
    });

    it('deve atualizar um cliente existente', () => {
      component.editId = '123';
      component.form.patchValue({
        name: 'Raphael', cpf: '123', email: 'a@a.com', phone: '111', 
        birthDate: '2000-01-01', clientType: 'INDIVIDUAL', validCnh: true
      });

      customerServiceMock.update.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(customerServiceMock.update).toHaveBeenCalledWith('123', expect.any(Object));
      expect(toastServiceMock.success).toHaveBeenCalledWith('Cliente atualizado!');
    });
  });

  describe('Exclusão (SweetAlert)', () => {
    it('deve excluir cliente', async () => {
      vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      customerServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete({ id: '1', name: 'Raphael' } as any);

      expect(customerServiceMock.delete).toHaveBeenCalledWith('1');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Cliente excluído!');
    });

    it('deve excluir endereço', async () => {
      vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      addressServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'loadAddresses').mockImplementation(() => {});

      await component.deleteAddr({ id: 'a1' } as any);

      expect(addressServiceMock.delete).toHaveBeenCalledWith('a1');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Endereço removido!');
    });
  });
});