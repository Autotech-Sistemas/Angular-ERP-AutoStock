import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sellers } from './sellers';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks dos serviços
import { SellerService } from '../../services/seller.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('SellersComponent', () => {
  let component: Sellers;
  let fixture: ComponentFixture<Sellers>;

  let sellerServiceMock: any;
  let toastServiceMock: any;
  let cacheServiceMock: any;

  beforeEach(async () => {
    sellerServiceMock = {
      getAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    toastServiceMock = { success: vi.fn(), error: vi.fn() };

    cacheServiceMock = {
      has: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      invalidate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Sellers, ReactiveFormsModule],
      providers: [
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
        { provide: CacheService, useValue: cacheServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Sellers);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('Carregamento (load e refresh)', () => {
    const mockResponse = {
      _embedded: {
        sellerResponseDTOList: [{ id: '1', name: 'João', email: 'joao@auto.com', salary: 3000 }],
      },
      page: { totalElements: 1 },
    };

    it('deve buscar vendedores da API e salvar no cache se não estiver cached', () => {
      cacheServiceMock.has.mockReturnValue(false);
      sellerServiceMock.getAll.mockReturnValue(of(mockResponse));

      component.load(0);

      expect(sellerServiceMock.getAll).toHaveBeenCalledWith(0);
      expect(component.items.length).toBe(1);
      expect(cacheServiceMock.set).toHaveBeenCalledWith('sellers_page_0', expect.any(Object));
      expect(cacheServiceMock.set).toHaveBeenCalledWith('sellers_all', expect.any(Array));
    });

    it('deve carregar do cache sem bater na API se os dados já existirem', () => {
      const cachedData = { items: [{ id: '99', name: 'Maria' }], total: 5 };
      cacheServiceMock.has.mockReturnValue(true);
      cacheServiceMock.get.mockReturnValue(cachedData);

      component.load(0);

      expect(sellerServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.items.length).toBe(1);
      expect(component.totalElements).toBe(5);
    });

    it('deve invalidar cache e forçar recarregamento em refresh()', () => {
      const loadSpy = vi.spyOn(component, 'load').mockImplementation(() => {});

      component.refresh();

      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('sellers_page_0');
      expect(cacheServiceMock.invalidate).toHaveBeenCalledWith('sellers_all');
      expect(loadSpy).toHaveBeenCalledWith(0, true);
    });
  });

  describe('Validação Dinâmica de Senha e Modais', () => {
    it('deve tornar a senha OBRIGATÓRIA e resetar form em openNew()', () => {
      component.openNew();

      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('');

      // Valida se o validador de required foi inserido no campo password
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.invalid).toBe(true);
    });

    it('deve REMOVER obrigatoriedade da senha e popular dados em openEdit()', () => {
      const mockSeller = { id: '77', name: 'Pedro', hireDate: '2026-03-25T14:00:00' } as any;

      component.openEdit(mockSeller);

      expect(component.modalOpen).toBe(true);
      expect(component.editId).toBe('77');
      expect(component.form.value.name).toBe('Pedro');
      expect(component.form.value.hireDate).toBe('2026-03-25'); // Substring correto

      // Valida se o validador de required sumiu do campo password
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.valid).toBe(true); // Vazio não deve dar erro na edição
    });

    it('deve abrir modal de visualização em openView()', () => {
      const mockSeller = { id: '55', name: 'Ana' } as any;
      component.openView(mockSeller);

      expect(component.viewModalOpen).toBe(true);
      expect(component.selectedSeller).toEqual(mockSeller);
    });
  });

  describe('Eventos Visuais', () => {
    it('deve aplicar máscara de telefone e atualizar o formulário em onPhone()', () => {
      const inputEvent = { target: { value: '11999998888' } } as unknown as Event;

      component.onPhone(inputEvent);

      expect((inputEvent.target as HTMLInputElement).value).toBe('(11) 99999-8888');
      expect(component.form.value.phone).toBe('(11) 99999-8888');
    });
  });

  describe('Lógica de Salvar (save)', () => {
    it('não deve salvar e deve exibir erro se formulário for inválido', () => {
      component.form.reset(); // Inválido (faltam Nome, Email, etc)
      component.save();

      expect(sellerServiceMock.create).not.toHaveBeenCalled();
      expect(toastServiceMock.error).toHaveBeenCalledWith(
        'Preencha os campos obrigatórios antes de salvar.',
      );
    });

    it('deve enviar payload com senha na CRIAÇÃO', () => {
      component.openNew(); // Configura como novo
      component.form.patchValue({
        name: 'Ana',
        email: 'ana@test.com',
        password: '123',
        hireDate: '2026-01-01',
        salary: 2000,
        commissionRate: 5,
      });

      sellerServiceMock.create.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(sellerServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: '123',
        }),
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Vendedor cadastrado!');
      expect(component.modalOpen).toBe(false);
    });

    it('deve enviar payload de ATUALIZAÇÃO para a API ignorando senha', () => {
      component.openEdit({ id: '55' } as any); // Configura como edição
      component.form.patchValue({
        name: 'Ana Silva',
        email: 'ana@test.com',
        hireDate: '2026-01-01',
        salary: 2500,
        commissionRate: 6,
      });

      sellerServiceMock.update.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      component.save();

      expect(sellerServiceMock.update).toHaveBeenCalledWith(
        '55',
        expect.objectContaining({
          name: 'Ana Silva',
          salary: 2500,
        }),
      );
      expect(toastServiceMock.success).toHaveBeenCalledWith('Vendedor atualizado!');
    });
  });

  describe('Exclusão', () => {
    it('deve excluir vendedor após confirmação do SweetAlert', async () => {
      const mockSeller = { id: '9', name: 'Carlos' } as any;
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
      sellerServiceMock.delete.mockReturnValue(of({}));
      vi.spyOn(component, 'load').mockImplementation(() => {});

      await component.delete(mockSeller);

      expect(swalSpy).toHaveBeenCalled();
      expect(sellerServiceMock.delete).toHaveBeenCalledWith('9');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Vendedor excluído!');
    });

    it('não deve chamar a API se a exclusão for cancelada no popup', async () => {
      const swalSpy = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: false } as any);

      await component.delete({ id: '9' } as any);

      expect(sellerServiceMock.delete).not.toHaveBeenCalled();
    });
  });
});
