import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatDate } from '../../shared/helpers/formatters.helper';
import { forkJoin, catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Modal } from '../../shared/components/modal/modal';
import { RecordPicker } from '../../shared/components/record-picker/record-picker';
import { CustomerService } from '../../services/customer.service';
import { InventoryService } from '../../services/inventory.service';
import { SaleService } from '../../services/sale.service';
import { SellerService } from '../../services/seller.service';
import {
  SaleRequest,
  SalePatchRequest,
  SaleResponseDTO,
  CustomerResponseDTO,
  SellerResponseDTO,
  InventoryItemResponseDTO,
  PagedResponse,
  SelectionOption,
} from '../../shared/interfaces';

@Component({
  selector: 'app-sales',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination, RecordPicker],
  templateUrl: './sales.html',
  styleUrl: './sales.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sales implements OnInit {
  private svc = inject(SaleService);
  private custSvc = inject(CustomerService);
  private selSvc = inject(SellerService);
  private invSvc = inject(InventoryService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  saving = false;
  modalOpen = false;
  editModalOpen = false;
  viewModalOpen = false;
  showInstallments = false;
  editShowInstallments = false;
  formStep = 1;
  customerPickerOpen = false;
  sellerPickerOpen = false;
  inventoryPickerOpen = false;

  items: SaleResponseDTO[] = [];
  customers: CustomerResponseDTO[] = [];
  sellers: SellerResponseDTO[] = [];
  inventory: InventoryItemResponseDTO[] = [];

  selectedSale: SaleResponseDTO | null = null;

  page = 0;
  totalElements = 0;
  netDisplay = 'R$ 0,00';
  searchQuery = '';

  fmtCurrency = (v: number | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  fmtDate = formatDate;

  form = this.fb.group({
    customerId: ['', Validators.required],
    sellerId: ['', Validators.required],
    inventoryId: ['', Validators.required],
    saleDate: ['', Validators.required],
    paymentMethod: ['CASH', Validators.required],
    installmentsNumber: [null as number | null],
    grossAmount: [0, [Validators.required, Validators.min(0.01)]],
    appliedDiscount: [0],
    receipt: ['', Validators.required],
    invoice: [''],
  });

  editForm = this.fb.group({
    paymentMethod: ['', Validators.required],
    installmentsNumber: [null as number | null],
    appliedDiscount: [0],
    netAmount: [0],
    customerId: [''],
    invoice: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  get filteredItems(): SaleResponseDTO[] {
    if (!this.searchQuery) return this.items;
    const q = this.searchQuery.toLowerCase();
    return this.items.filter(
      (s) =>
        s.receipt?.toLowerCase().includes(q) ||
        s.invoice?.toLowerCase().includes(q) ||
        s.customer?.name?.toLowerCase().includes(q) ||
        s.inventoryItem?.licensePlate?.toLowerCase().includes(q),
    );
  }

  private cacheKey(page: number): string {
    return `sales_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: SaleResponseDTO[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r: PagedResponse<SaleResponseDTO>) => {
        this.items = r._embedded?.['saleResponseDTOList'] ?? [];
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

  getPaymentMethodConfig(method: string | undefined): { label: string; bg: string; text: string } {
    const m = method ?? 'OTHER';
    const config: Record<string, { label: string; bg: string; text: string }> = {
      CASH: { label: '\u00C0 Vista', bg: '#dcfce7', text: '#16a34a' },
      PIX: { label: 'PIX', bg: '#e0f2fe', text: '#0284c7' },
      CREDIT_CARD: { label: 'Cart\u00E3o de Cr\u00E9dito', bg: '#fef3c7', text: '#d97706' },
      DEBIT_CARD: { label: 'Cart\u00E3o de D\u00E9bito', bg: '#f3f4f6', text: '#4b5563' },
      BANK_TRANSFER: { label: 'Transfer\u00EAncia', bg: '#eff6ff', text: '#2563eb' },
      INSTALLMENTS_WITHOUT_INTEREST: {
        label: 'Parcelado (Sem Juros)',
        bg: '#fce7f3',
        text: '#9333ea',
      },
      INSTALLMENTS_WITH_INTEREST: {
        label: 'Parcelado (Com Juros)',
        bg: '#fae8ff',
        text: '#db2777',
      },
      FINANCED_BY_BANK: { label: 'Financiamento (Banco)', bg: '#ffedd5', text: '#ea580c' },
      FINANCED_BY_DEALERSHIP: { label: 'Financiamento (Loja)', bg: '#fee2e2', text: '#dc2626' },
      TRADE_IN: { label: 'Troca', bg: '#ecfeff', text: '#0891b2' },
      OTHER: { label: 'Outro', bg: '#f3f4f6', text: '#4b5563' },
    };
    return config[m] ?? config['OTHER'];
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isInvalidEdit(controlName: string): boolean {
    const control = this.editForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  openView(sale: SaleResponseDTO): void {
    this.selectedSale = sale;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(sale: SaleResponseDTO): void {
    this.selectedSale = sale;
    this.loadDependenciesForForm(false);
    this.editForm.reset({
      paymentMethod: sale.paymentMethod ?? 'CASH',
      installmentsNumber: sale.installmentsNumber ?? null,
      appliedDiscount: sale.appliedDiscount ?? 0,
      netAmount: sale.netAmount ?? sale.grossAmount ?? 0,
      customerId: sale.customer?.id ?? '',
      invoice: sale.invoice ?? '',
    });
    this.toggleEditInstallments();
    this.editModalOpen = true;
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.loadDependenciesForForm(true, () => {
      this.form.reset({ paymentMethod: 'CASH', grossAmount: 0, appliedDiscount: 0, invoice: '' });
      this.netDisplay = 'R$ 0,00';
      this.showInstallments = false;
      this.formStep = 1;
      this.loading = false;
      this.modalOpen = true;
      this.cdr.markForCheck();
    });
  }

  get customerOptions(): SelectionOption[] {
    return this.customers.map((customer) => ({
      id: customer.id ?? '',
      label: customer.name ?? 'Cliente sem nome',
      description: `CPF: ${customer.cpf ?? 'N/A'} | ${customer.email ?? 'Sem email'}`,
    }));
  }

  get sellerOptions(): SelectionOption[] {
    return this.sellers.map((seller) => ({
      id: seller.id ?? '',
      label: seller.name ?? 'Vendedor sem nome',
      description: seller.email ?? seller.phone ?? 'Sem contato',
    }));
  }

  get inventoryOptions(): SelectionOption[] {
    return this.inventory.map((item) => ({
      id: item.id ?? '',
      label: `${item.vehicle?.brand ?? 'Ve\u00EDculo'} ${item.vehicle?.model ?? ''}`.trim(),
      description: `Placa: ${item.licensePlate ?? 'N/A'} | ${item.vehicle?.manufactureYear ?? 'Ano N/A'}`,
    }));
  }

  selectedCustomerLabel(id?: string | null): string {
    return this.customerOptions.find((option) => option.id === id)?.label ?? 'Selecionar cliente';
  }

  selectedSellerLabel(id?: string | null): string {
    return this.sellerOptions.find((option) => option.id === id)?.label ?? 'Selecionar vendedor';
  }

  selectedInventoryLabel(id?: string | null): string {
    return this.inventoryOptions.find((option) => option.id === id)?.label ?? 'Selecionar ve\u00EDculo';
  }

  selectCustomer(id: string): void {
    this.form.patchValue({ customerId: id });
    this.customerPickerOpen = false;
    this.cdr.markForCheck();
  }

  selectSeller(id: string): void {
    this.form.patchValue({ sellerId: id });
    this.sellerPickerOpen = false;
    this.cdr.markForCheck();
  }

  selectInventory(id: string): void {
    this.form.patchValue({ inventoryId: id });
    this.inventoryPickerOpen = false;
    this.fillPrice();
    this.cdr.markForCheck();
  }

  nextStep(): void {
    if (this.formStep === 1) {
      const requiredControls = ['inventoryId', 'customerId', 'sellerId', 'saleDate'];
      const invalid = requiredControls.some((name) => this.form.get(name)?.invalid);
      if (invalid) {
        requiredControls.forEach((name) => this.form.get(name)?.markAsTouched());
        this.toast.error('Selecione os registros vinculados antes de continuar.');
        this.cdr.markForCheck();
        return;
      }
    }

    if (this.formStep < 3) {
      this.formStep += 1;
      this.cdr.markForCheck();
    }
  }

  previousStep(): void {
    if (this.formStep > 1) {
      this.formStep -= 1;
      this.cdr.markForCheck();
    }
  }

  private loadDependenciesForForm(
    includeInventory: boolean,
    onLoaded?: () => void,
  ): void {
    forkJoin({
      c: this.cache.has('customers_all')
        ? of<PagedResponse<CustomerResponseDTO>>({
            _embedded: {
              customerResponseDTOList: this.cache.get<CustomerResponseDTO[]>('customers_all') ?? [],
            },
          })
        : this.custSvc.getAll(0, 200).pipe(catchError(() => of(null))),
      s: this.cache.has('sellers_all')
        ? of<PagedResponse<SellerResponseDTO>>({
            _embedded: {
              sellerResponseDTOList: this.cache.get<SellerResponseDTO[]>('sellers_all') ?? [],
            },
          })
        : this.selSvc.getAll(0, 200).pipe(catchError(() => of(null))),
      i: includeInventory
        ? this.invSvc.getAll(0, 500).pipe(catchError(() => of(null)))
        : of<PagedResponse<InventoryItemResponseDTO> | null>(null),
    }).subscribe((res) => {
      this.customers = res.c?._embedded?.['customerResponseDTOList'] ?? [];
      this.sellers = res.s?._embedded?.['sellerResponseDTOList'] ?? [];

      if (includeInventory) {
        const allInventory = res.i?._embedded?.['inventoryItemResponseDTOList'] ?? [];
        this.inventory = allInventory.filter((item) => !item.stockExitDate);
      }

      this.cache.set('customers_all', this.customers);
      this.cache.set('sellers_all', this.sellers);
      onLoaded?.();
    });
  }

  fillPrice(): void {
    const sel = this.form.value.inventoryId;
    const item = this.inventory.find((i) => i.id === sel);
    if (item?.vehicle?.salePrice) {
      this.form.patchValue({ grossAmount: item.vehicle.salePrice });
      this.calcNet();
    }
  }

  calcNet(): void {
    const g = this.form.value.grossAmount ?? 0;
    const d = Math.min(this.form.value.appliedDiscount ?? 0, g);
    if (d !== this.form.value.appliedDiscount) {
      this.form.patchValue({ appliedDiscount: d }, { emitEvent: false });
    }
    this.netDisplay = this.fmtCurrency(g - d);
    this.cdr.markForCheck();
  }

  calcEditNet(): void {
    const gross = this.selectedSale?.grossAmount ?? 0;
    const disc = Math.min(this.editForm.value.appliedDiscount ?? 0, gross);
    if (disc !== this.editForm.value.appliedDiscount) {
      this.editForm.patchValue({ appliedDiscount: disc }, { emitEvent: false });
    }
    this.editForm.patchValue({ netAmount: gross - disc }, { emitEvent: false });
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

  toggleEditInstallments(): void {
    const method = this.editForm.value.paymentMethod ?? '';
    this.editShowInstallments = method.includes('INSTALLMENT') || method.includes('FINANCED');
    if (!this.editShowInstallments) {
      this.editForm.patchValue({ installmentsNumber: null }, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigat\u00F3rios destacados em vermelho.');
      return;
    }

    if (this.showInstallments && !(this.form.value.installmentsNumber && this.form.value.installmentsNumber > 0)) {
      this.form.get('installmentsNumber')?.markAsTouched();
      this.toast.error('Informe o n\u00FAmero de parcelas para a forma de pagamento selecionada.');
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    this.cdr.markForCheck();

    const v = this.form.value;
    const gross = v.grossAmount ?? 0;
    const disc = v.appliedDiscount ?? 0;

    const body: SaleRequest = {
      saleDate: v.saleDate!,
      grossAmount: gross,
      netAmount: gross - disc,
      appliedDiscount: disc,
      paymentMethod: v.paymentMethod!,
      installmentsNumber: v.installmentsNumber ?? undefined,
      receipt: v.receipt!,
      sellerId: v.sellerId!,
      customerId: v.customerId!,
      inventoryId: v.inventoryId!,
    };

    if (v.invoice) body.invoice = v.invoice;

    this.svc.create(body).subscribe({
      next: () => {
        this.toast.success('Venda registrada com sucesso!');
        this.modalOpen = false;
        this.saving = false;
        this.invalidateAllPages();
        this.cache.invalidate('inventory_all');
        this.load(this.page, true);
      },
      error: (e: { error?: { message?: string }; message?: string }) => {
        const errorMsg = e?.error?.message || e?.message || '';
        if (
          errorMsg.includes('tb_sales_inventory_item_id_key') ||
          errorMsg.includes('duplicate key')
        ) {
          this.toast.error('Este ve\u00EDculo j\u00E1 foi vendido! O estoque est\u00E1 desatualizado.');
        } else {
          this.toast.error(errorMsg || 'Erro ao registrar venda');
        }
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios corretamente.');
      return;
    }

    if (!this.selectedSale) return;

    this.saving = true;
    this.cdr.markForCheck();

    const v = this.editForm.value;
    const body: SalePatchRequest = {
      paymentMethod: v.paymentMethod as string,
      installmentsNumber: v.installmentsNumber ?? undefined,
      appliedDiscount: v.appliedDiscount ?? 0,
      netAmount: v.netAmount ?? 0,
      customerId: v.customerId || undefined,
      invoice: v.invoice || undefined,
    };

    (this.svc as any).patch(this.selectedSale.id!, body).subscribe({
      next: () => {
        this.toast.success('Venda atualizada com sucesso!');
        this.editModalOpen = false;
        this.saving = false;
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message || e?.message || 'Erro ao atualizar venda');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  delete(sale: SaleResponseDTO): void {
    Swal.fire({
      title: 'Cancelar Venda',
      text: `Tem certeza que deseja cancelar a venda ${sale.receipt}? O veículo retornará ao estoque.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, cancelar venda',
      cancelButtonText: 'Voltar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.cdr.markForCheck();
        (this.svc as any).delete(sale.id!).subscribe({
          next: () => {
            this.toast.success('Venda cancelada com sucesso!');
            this.invalidateAllPages();
            this.cache.invalidate('inventory_all');
            this.load(0, true);
          },
          error: (e: any) => {
            this.toast.error(e?.error?.message || e?.message || 'Erro ao cancelar venda');
            this.loading = false;
            this.cdr.markForCheck();
          },
        });
      }
    });
  }

  invalidateAllPages(): void {
    // Limpa as primeiras páginas de cache de vendas para forçar atualização
    for (let i = 0; i < 20; i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }

  printReceipt(): void {
    window.print();
  }
}
