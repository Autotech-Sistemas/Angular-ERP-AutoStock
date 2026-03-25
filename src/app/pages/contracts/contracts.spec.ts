import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contracts } from './contracts';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks dos serviços
import { ContractService } from '../../services/contract.service';
import { SaleService } from '../../services/sale.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('ContractsComponent', () => {
  let component: Contracts;
  let fixture: ComponentFixture<Contracts>;

  let contractServiceMock: any;
  let saleServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    contractServiceMock = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    saleServiceMock = { getAll: vi.fn() };
    toastServiceMock = { success: vi.fn(), error: vi.fn() };
    cacheServiceMock = { has: vi.fn(), get: vi.fn(), set: vi.fn(), invalidate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Contracts, ReactiveFormsModule],
      providers: [
        { provide: ContractService, useValue: contractServiceMock },
        { provide: SaleService, useValue: saleServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Contracts);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento de Dados (load e refresh)', () => {
    const mockResponse = {
      _embedded: { contractResponseDTOList: [{ id: '1', contractNumber: 'CONT-001' }] },
      page: { totalElements: 1 },
    };

    it('deve buscar dados da API se não houver cache', () => {
      cacheServiceMock.has.mockReturnValue(false);
      contractServiceMock.getAll.mockReturnValue(of(mockResponse));

      component.load(0);

      expect(contractServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalled();
    });

    it('deve usar o cache se disponível e não for refresh forçado', () => {
      const cachedData = { items: [{ id: '2', contractNumber: 'CONT-002' }], total: 5 };
      cacheServiceMock.has.mockReturnValue(true);
      cacheServiceMock.get.mockReturnValue(cachedData);

      component.load(0);

      expect(contractServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(5);
    });

    it('deve invalidar o cache e forçar recarregamento ao chamar refresh()', () => {
      const loadSpy = vi.spyOn(component, 'load').mockImplementation(() => {});
      
      component.refresh();

      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('contracts_page_0');
      expect(loadSpy).toHaveBeenCalledWith(0, true);
    });
  });

  describe('Abertura de Modais', () => {
    it('deve abrir modal de novo contrato, buscar vendas e limpar formulário', () => {
      cacheServiceMock.has.mockReturnValue(false);
      saleServiceMock.getAll.mockReturnValue(of({ _embedded: { saleResponseDTOList: [{ id: 's1' }] } }));

      component.openNew();

      expect(saleServiceMock.getAll).toHaveBeenCalled();
      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('');
      expect(component.form.value.paymentTerms).toBe('CASH');
    });

    it('deve abrir modal de visualização', () => {
      const mockContract = { id: '1', contractNumber: '123' } as any;
      component.openView(mockContract);

      expect(component.selectedContract).toEqual(mockContract);
      expect(component.viewModalOpen).toBe(true);
    });

    it('deve preencher o formulário e abrir o modal ao chamar openEdit()', () => {
      const mockContract = {
        id: '1',
        contractNumber: 'CONT-999',
        contractDate: '2026-03-25T10:00:00',
        totalAmount: 50000,
        sale: { id: 's1' }
      } as any;

      cacheServiceMock.has.mockReturnValue(true); // Simula que as vendas já estão em cache
      cacheServiceMock.get.mockReturnValue([{ id: 's1' }]);

      component.openEdit(mockContract);

      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('1');
      expect(component.form.value.contractNumber).toBe('CONT-999');
      expect(component.form.value.contractDate).toBe('2026-03-25'); // Testa o substring(0, 10)
      expect(component.form.value.saleId).toBe('s1');
    });
  });

  describe('Lógica de Salvar (save)', () => {
    it('deve exibir erro no toast se o formulário for inválido', () => {
      component.form.reset(); // Zera o form para deixá-lo inválido
      component.save();

      expect(toastServiceMock.error).toHaveBeenCalledWith('Preencha os campos obrigatórios antes de salvar.');
      expect(contractServiceMock.create).not.toHaveBeenCalled();
    });

    it('deve chamar create() quando não houver editId', () => {
      component.editId = '';
      component.form.patchValue({
        contractNumber: 'C1', contractType: 'Venda', contractDate: '2026-03-25',
        deliveryDate: '2026-04-01', totalAmount: 100, paymentTerms: 'PIX', saleId: 's1'
      });

      contractServiceMock.create.mockReturnValue(of({}));
      const loadSpy = vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(contractServiceMock.create).toHaveBeenCalled();
      expect(toastServiceMock.success).toHaveBeenCalledWith('Contrato criado!');
      expect(component.modalOpen).toBe(false);
    });

    it('deve chamar update() enviando um Partial do contrato quando houver editId', () => {
      component.editId = '123';
      component.form.patchValue({
        contractNumber: 'C1', contractType: 'Venda', contractDate: '2026-03-25',
        deliveryDate: '2026-04-01', totalAmount: 100, paymentTerms: 'PIX', saleId: 's1',
        contractStatus: 'SIGNED', notes: 'Teste'
      });

      contractServiceMock.update.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      // Verifica se o payload enviado no update foi apenas o Partial esperado
      expect(contractServiceMock.update).toHaveBeenCalledWith('123', {
        contractStatus: 'SIGNED',
        deliveryDate: '2026-04-01',
        notes: 'Teste'
      });
      expect(toastServiceMock.success).toHaveBeenCalledWith('Contrato atualizado!');
    });
  });

  describe('Lógica de Exclusão (delete)', () => {
    it('deve excluir se o usuário confirmar no modal do SweetAlert', async () => {
      const mockContract = { id: '99' } as any;
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      contractServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete(mockContract);

      expect(swalSpy).toHaveBeenCalled();
      expect(contractServiceMock.delete).toHaveBeenCalledWith('99');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Contrato excluído!');
    });

    it('NÃO deve excluir se o usuário cancelar no modal do SweetAlert', async () => {
      const mockContract = { id: '99' } as any;
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);

      await component.delete(mockContract);

      expect(swalSpy).toHaveBeenCalled();
      expect(contractServiceMock.delete).not.toHaveBeenCalled();
    });
  });
});