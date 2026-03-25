import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Appointments } from './appointments';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Interfaces mockadas baseadas no seu código
import { AppointmentService } from '../../services/appointment.service';
import { CustomerService } from '../../services/customer.service';
import { SellerService } from '../../services/seller.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('AppointmentsComponent', () => {
  let component: Appointments;
  let fixture: ComponentFixture<Appointments>;

  // Declaração dos Mocks para o Vitest
  let appointmentServiceMock: any;
  let customerServiceMock: any;
  let sellerServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    // Criando objetos com funções mockadas usando vi.fn()
    appointmentServiceMock = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };
    
    customerServiceMock = { getAll: vi.fn() };
    sellerServiceMock = { getAll: vi.fn() };
    toastServiceMock = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    cacheServiceMock = { has: vi.fn(), get: vi.fn(), set: vi.fn(), invalidate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Appointments, ReactiveFormsModule],
      providers: [
        { provide: AppointmentService, useValue: appointmentServiceMock },
        { provide: CustomerService, useValue: customerServiceMock },
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      // Ignora erros de componentes filhos não importados (ex: app-modal, app-pagination)
      schemas: [NO_ERRORS_SCHEMA] 
    }).compileComponents();

    fixture = TestBed.createComponent(Appointments);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento de Dados (load)', () => {
    const mockResponse = {
      _embedded: { appointmentResponseDTOList: [{ id: '1', date: '2026-03-24', appointmentType: 'TEST_DRIVE' }] },
      page: { totalElements: 1 }
    };

    it('deve buscar dados da API se não houver cache', () => {
      // Simula que o cache está vazio
      cacheServiceMock.has.mockReturnValue(false);
      // Simula o retorno da API
      appointmentServiceMock.getAll.mockReturnValue(of(mockResponse));

      component.load(0);

      expect(appointmentServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalled(); // Verifica se salvou no cache
    });

    it('deve usar o cache se estiver disponível e não for forçado o refresh', () => {
      const cachedData = { items: [{ id: '2' }], total: 5 };
      cacheServiceMock.has.mockReturnValue(true);
      cacheServiceMock.get.mockReturnValue(cachedData);

      component.load(0);

      expect(appointmentServiceMock.getAll).not.toHaveBeenCalled(); // Não deve bater na API
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(5);
    });
  });

  describe('Ações de UI', () => {
    it('deve resetar o formulário e abrir o modal ao chamar openNew()', () => {
      // Simula retorno vazio para simplificar
      customerServiceMock.getAll.mockReturnValue(of({}));
      sellerServiceMock.getAll.mockReturnValue(of({}));
      cacheServiceMock.has.mockReturnValue(false);

      component.openNew();

      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('');
      expect(component.form.value.appointmentType).toBe('TEST_DRIVE');
    });

    it('deve preencher o formulário e abrir o modal ao chamar openEdit()', () => {
      const mockApt = { id: '123', appointmentType: 'NEGOTIATION_VISIT', date: '2026-03-24T10:00:00' } as any;
      
      customerServiceMock.getAll.mockReturnValue(of({}));
      sellerServiceMock.getAll.mockReturnValue(of({}));
      
      component.openEdit(mockApt);

      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('123');
      expect(component.form.value.appointmentType).toBe('NEGOTIATION_VISIT');
      expect(component.form.value.date).toBe('2026-03-24'); // Verifica se cortou a string da data corretamente
    });
  });

  describe('Salvar e Deletar', () => {
    it('deve chamar o serviço de criação se editId estiver vazio', () => {
      component.editId = '';
      // Preenche o form para ele ficar válido
      component.form.patchValue({
        customerId: 'c1', sellerId: 's1', date: '2026-03-24', appointmentType: 'TEST_DRIVE'
      });
      
      appointmentServiceMock.create.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(appointmentServiceMock.create).toHaveBeenCalled();
      expect(toastServiceMock.success).toHaveBeenCalledWith('Agendamento criado!');
      expect(component.modalOpen).toBe(false);
      
      loadSpy.mockRestore(); // Limpa o spy
    });

    it('não deve salvar se o formulário for inválido', () => {
      component.form.reset(); // Formulário vazio é inválido
      component.save();
      expect(appointmentServiceMock.create).not.toHaveBeenCalled();
      expect(appointmentServiceMock.update).not.toHaveBeenCalled();
    });

    it('deve excluir o agendamento se o usuário confirmar no SweetAlert', async () => {
      const mockApt = { id: '1' } as any;
      
      // Intercepta a chamada do Swal e simula o usuário clicando em "Sim"
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      appointmentServiceMock.delete.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete(mockApt);

      expect(swalSpy).toHaveBeenCalled();
      expect(appointmentServiceMock.delete).toHaveBeenCalledWith('1');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Agendamento excluído!');
      
      swalSpy.mockRestore();
      loadSpy.mockRestore();
    });

    it('NÃO deve excluir o agendamento se o usuário cancelar no SweetAlert', async () => {
      const mockApt = { id: '1' } as any;
      
      // Simula o usuário clicando em "Não" (cancelando)
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);

      await component.delete(mockApt);

      expect(appointmentServiceMock.delete).not.toHaveBeenCalled();
      swalSpy.mockRestore();
    });
  });
});