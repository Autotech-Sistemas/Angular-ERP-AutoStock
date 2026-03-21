import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatDate } from '../../shared/helpers/formatters.helper';
import { forkJoin, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Modal } from '../../shared/components/modal/modal';
import { CustomerService } from '../../services/customer.service';
import { InventoryService } from '../../services/inventory.service';
import { SaleService } from '../../services/sale.service';
import { SellerService } from '../../services/seller.service';
import { 
  SaleResponseDTO, 
  CustomerResponseDTO, 
  SellerResponseDTO, 
  InventoryItemResponseDTO, 
  PagedResponse 
} from '../../shared/interfaces/models.interface';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private svc     = inject(SaleService);
  private custSvc = inject(CustomerService);
  private selSvc  = inject(SellerService);
  private invSvc  = inject(InventoryService);
  private toast   = inject(ToastService);
  private cache   = inject(CacheService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading          = false;
  saving           = false;
  modalOpen        = false;
  viewModalOpen    = false;
  showInstallments = false;
  
  items: SaleResponseDTO[] = [];
  customers: CustomerResponseDTO[] = [];
  sellers: SellerResponseDTO[] = [];
  inventory: InventoryItemResponseDTO[] = [];
  
  selectedSale: SaleResponseDTO | null = null;
  
  page          = 0;
  totalElements = 0;
  netDisplay    = 'R$ 0,00';

  fmtCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  fmtDate     = formatDate;

  form = this.fb.group({
    customerId:         ['', Validators.required],
    sellerId:           ['', Validators.required],
    inventoryId:        ['', Validators.required],
    saleDate:           ['', Validators.required],
    paymentMethod:      ['CASH', Validators.required],
    installmentsNumber: [null as number | null],
    grossAmount:        [0, [Validators.required, Validators.min(0.01)]],
    appliedDiscount:    [0],
    receipt:            ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `sales_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: SaleResponseDTO[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (response) => {
        const r = response as unknown as PagedResponse<SaleResponseDTO>;
        this.items         = r._embedded?.['saleResponseDTOList'] ?? [];
        this.totalElements = r.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  refresh(): void {
    this.cache.invalidate(this.cacheKey(this.page));
    this.load(this.page, true);
  }

  getPaymentMethodConfig(method: string | undefined): { label: string, bg: string, text: string } {
    const m = method || 'OTHER';
    const config: Record<string, { label: string, bg: string, text: string }> = {
      'CASH': { label: 'À Vista', bg: '#dcfce7', text: '#16a34a' },
      'PIX': { label: 'PIX', bg: '#e0f2fe', text: '#0284c7' },
      'CREDIT_CARD': { label: 'Cartão de Crédito', bg: '#fef3c7', text: '#d97706' },
      'DEBIT_CARD': { label: 'Cartão de Débito', bg: '#f3f4f6', text: '#4b5563' },
      'BANK_TRANSFER': { label: 'Transferência', bg: '#eff6ff', text: '#2563eb' },
      'INSTALLMENTS_WITHOUT_INTEREST': { label: 'Parcelado (Sem Juros)', bg: '#fce7f3', text: '#9333ea' },
      'INSTALLMENTS_WITH_INTEREST': { label: 'Parcelado (Com Juros)', bg: '#fae8ff', text: '#db2777' },
      'FINANCED_BY_BANK': { label: 'Financiamento (Banco)', bg: '#ffedd5', text: '#ea580c' },
      'FINANCED_BY_DEALERSHIP': { label: 'Financiamento (Loja)', bg: '#fee2e2', text: '#dc2626' },
      'TRADE_IN': { label: 'Troca', bg: '#ecfeff', text: '#0891b2' },
      'OTHER': { label: 'Outro', bg: '#f3f4f6', text: '#4b5563' }
    };
    return config[m] || config['OTHER'];
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  openView(sale: SaleResponseDTO): void {
    this.selectedSale = sale;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.loading = true; 
    this.cdr.markForCheck();

    forkJoin({
      c: this.cache.has('customers_all')
        ? of({ _embedded: { customerResponseDTOList: this.cache.get('customers_all') } })
        : this.custSvc.getAll(0, 200).pipe(catchError(() => of(null))),
      s: this.cache.has('sellers_all')
        ? of({ _embedded: { sellerResponseDTOList: this.cache.get('sellers_all') } })
        : this.selSvc.getAll(0, 200).pipe(catchError(() => of(null))),
      i: this.invSvc.getAll(0, 500).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      this.customers = (res.c as any)?._embedded?.customerResponseDTOList ?? [];
      this.sellers   = (res.s as any)?._embedded?.sellerResponseDTOList   ?? [];
      
      const allInventory = (res.i as any)?._embedded?.inventoryItemResponseDTOList ?? [];
      this.inventory = allInventory.filter((item: InventoryItemResponseDTO) => !item.stockExitDate);

      if (!this.cache.has('customers_all')) this.cache.set('customers_all', this.customers);
      if (!this.cache.has('sellers_all'))   this.cache.set('sellers_all',   this.sellers);

      this.form.reset({ paymentMethod: 'CASH', grossAmount: 0, appliedDiscount: 0 });
      this.netDisplay       = 'R$ 0,00';
      this.showInstallments = false;
      this.loading          = false;
      this.modalOpen        = true;
      this.cdr.markForCheck();
    });
  }

  fillPrice(): void {
    const sel  = this.form.value.inventoryId;
    const item = this.inventory.find((i: InventoryItemResponseDTO) => i.id === sel);
    if (item?.vehicle?.salePrice) {
      this.form.patchValue({ grossAmount: item.vehicle.salePrice });
      this.calcNet();
    }
  }

  calcNet(): void {
    const g = this.form.value.grossAmount ?? 0;
    const d = this.form.value.appliedDiscount ?? 0;
    this.netDisplay = this.fmtCurrency(g - d);
    this.cdr.markForCheck();
  }

  toggleInstallments(): void {
    const v = this.form.value.paymentMethod ?? '';
    this.showInstallments = v.includes('INSTALLMENT') || v.includes('FINANCED');
    
    if (!this.showInstallments) {
      this.form.patchValue({ installmentsNumber: null });
    }
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios destacados em vermelho.');
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const v     = this.form.value;
    const gross = v.grossAmount ?? 0;
    const disc  = v.appliedDiscount ?? 0;
    
    // Enviamos exatamente os atributos que o novo SaleRequestDTO do Java espera!
    const body  = {
      saleDate:           v.saleDate,
      grossAmount:        gross,
      netAmount:          gross - disc,
      appliedDiscount:    disc,
      paymentMethod:      v.paymentMethod,
      installmentsNumber: v.installmentsNumber ?? null,
      receipt:            v.receipt,
      sellerId:           v.sellerId,     // Agora passando o ID diretamente
      customerId:         v.customerId,   // Agora passando o ID diretamente
      inventoryId:        v.inventoryId,  // Agora passando o ID diretamente
    };

    this.svc.create(body as any).subscribe({
      next: () => {
        this.toast.success('Venda registrada com sucesso!');
        this.modalOpen = false;
        this.saving = false;
        this.invalidateAllPages();
        this.cache.invalidate('inventory_all'); 
        this.load(this.page, true);
      },
      error: (e) => {
        const errorMsg = e?.error?.message || e?.message || '';
        if (errorMsg.includes('tb_sales_inventory_item_id_key') || errorMsg.includes('duplicate key')) {
          this.toast.error('Este veículo já foi vendido! O estoque está desatualizado.');
        } else {
          this.toast.error(errorMsg || 'Erro ao registrar venda');
        }
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  async delete(s: SaleResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: 'Cancelar venda?', 
      text: 'Esta ação não pode ser desfeita e o veículo retornará ao estoque.',
      icon: 'warning',
      showCancelButton: true, 
      confirmButtonText: 'Sim, cancelar venda',
      cancelButtonText: 'Manter venda', 
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;

    this.svc.delete(s.id!).subscribe({
      next: () => {
        this.toast.success('Venda excluída. Veículo retornou ao estoque!');
        this.invalidateAllPages();
        this.cache.invalidate('inventory_all'); 
        this.load(this.page, true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro ao excluir'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}