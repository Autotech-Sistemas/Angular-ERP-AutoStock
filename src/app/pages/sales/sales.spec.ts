import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import Swal from 'sweetalert2';

import { Sales } from './sales';
import { SaleService } from '../../services/sale.service';
import { CustomerService } from '../../services/customer.service';
import { SellerService } from '../../services/seller.service';
import { InventoryService } from '../../services/inventory.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';

describe('Sales (Enterprise Spec)', () => {
  let component: Sales;
  let fixture: ComponentFixture<Sales>;

  const saleServiceMock = {
    getAll: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  const customerServiceMock = { getAll: vi.fn() };
  const sellerServiceMock = { getAll: vi.fn() };
  const inventoryServiceMock = { getAll: vi.fn() };

  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const cacheMock = {
    has: vi.fn().mockReturnValue(false),
    get: vi.fn(),
    set: vi.fn(),
    invalidate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Sales, ReactiveFormsModule],
      providers: [
        provideRouter([]),
        { provide: SaleService, useValue: saleServiceMock },
        { provide: CustomerService, useValue: customerServiceMock },
        { provide: SellerService, useValue: sellerServiceMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: ToastService, useValue: toastMock },
        { provide: CacheService, useValue: cacheMock },
      ],
    }).compileComponents();

    saleServiceMock.getAll.mockReturnValue(
      of({
        _embedded: { saleResponseDTOList: [] },
        page: { totalElements: 0 },
      }),
    );

    fixture = TestBed.createComponent(Sales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar vendas via service quando não houver cache', () => {
    component.load(0);
    expect(saleServiceMock.getAll).toHaveBeenCalledWith(0);
  });

  it('deve usar cache quando disponível', () => {
    vi.clearAllMocks();

    cacheMock.has.mockReturnValue(true);
    cacheMock.get.mockReturnValue({
      items: [{ receipt: '123' }],
      total: 1,
    });

    component.load(0);

    expect(component.items.length).toBe(1);
    expect(component.totalElements).toBe(1);
    expect(saleServiceMock.getAll).not.toHaveBeenCalled();
  });

  it('deve filtrar corretamente', () => {
    component.items = [
      { receipt: 'ABC', customer: { name: 'João' } } as any,
      { receipt: 'XYZ', customer: { name: 'Maria' } } as any,
    ];
    component.searchQuery = 'joão';
    expect(component.filteredItems.length).toBe(1);
  });

  it('deve calcular valor líquido corretamente', () => {
    component.form.patchValue({ grossAmount: 1000, appliedDiscount: 100 });
    component.calcNet();
    expect(component.netDisplay).toContain('900');
  });

  it('deve ativar parcelas quando método incluir INSTALLMENT', () => {
    component.form.patchValue({ paymentMethod: 'INSTALLMENTS_WITH_INTEREST' });
    component.toggleInstallments();
    expect(component.showInstallments).toBe(true);
  });

  it('não deve salvar se formulário inválido', () => {
    component.save();
    expect(toastMock.error).toHaveBeenCalled();
    expect(saleServiceMock.create).not.toHaveBeenCalled();
  });

  it('deve bloquear save se parcelas inválidas', () => {
    component.showInstallments = true;
    component.form.patchValue({
      customerId: '1',
      sellerId: '1',
      inventoryId: '1',
      saleDate: '2024-01-01',
      receipt: '123',
      grossAmount: 1000,
      paymentMethod: 'INSTALLMENTS_WITH_INTEREST',
      installmentsNumber: null,
    });

    component.save();

    expect(toastMock.error).toHaveBeenCalledWith(expect.stringMatching(/parcelas/i));
  });

  it('deve salvar com sucesso', () => {
    saleServiceMock.create.mockReturnValue(of({}));

    component.form.patchValue({
      customerId: '1',
      sellerId: '1',
      inventoryId: '1',
      saleDate: '2024-01-01',
      receipt: '123',
      grossAmount: 1000,
      paymentMethod: 'CASH',
    });

    component.save();

    expect(saleServiceMock.create).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('deve tratar erro de duplicate key', () => {
    saleServiceMock.create.mockReturnValue(
      throwError(() => ({
        error: { message: 'duplicate key value violates unique constraint' },
      })),
    );

    component.form.patchValue({
      customerId: '1',
      sellerId: '1',
      inventoryId: '1',
      saleDate: '2024-01-01',
      receipt: '123',
      grossAmount: 1000,
      paymentMethod: 'CASH',
    });

    component.save();

    expect(toastMock.error).toHaveBeenCalled();
  });

  it('deve atualizar venda com sucesso', () => {
    component.selectedSale = { id: '1', grossAmount: 1000 } as any;
    saleServiceMock.patch.mockReturnValue(of({}));

    component.editForm.patchValue({
      paymentMethod: 'CASH',
      appliedDiscount: 0,
      netAmount: 1000,
    });

    component.saveEdit();

    expect(saleServiceMock.patch).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('deve cancelar venda quando confirmado', async () => {
    vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true } as any);
    saleServiceMock.delete.mockReturnValue(of({}));

    component.delete({ id: '1', receipt: '123' } as any);

    await Promise.resolve();

    expect(saleServiceMock.delete).toHaveBeenCalled();
  });

  it('deve invalidar páginas de cache', () => {
    component.invalidateAllPages();
    expect(cacheMock.invalidate).toHaveBeenCalled();
  });

  it('deve chamar window.print ao imprimir recibo', () => {
    const spy = vi.spyOn(window, 'print').mockImplementation(() => {});
    component.printReceipt();
    expect(spy).toHaveBeenCalled();
  });
});
