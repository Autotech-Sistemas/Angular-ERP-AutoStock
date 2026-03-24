import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { VehicleService } from '../../services/vehicle.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatCurrency, formatDate } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
// 1. Importando todas as tipagens necessárias do seu models.interface
import {
  VehicleResponseDTO,
  InventoryItemResponseDTO,
  PagedResponse,
  InventoryItemRequest,
  InventoryItemPatchRequest,
} from '../../shared/interfaces';

@Component({
  selector: 'app-inventory',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inventory implements OnInit {
  private svc = inject(InventoryService);
  private vehSvc = inject(VehicleService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  modalOpen = false;
  editModalOpen = false;
  viewModalOpen = false;

  // 2. Tipando as listas (Substituindo any[])
  items: InventoryItemResponseDTO[] = [];
  filtered: InventoryItemResponseDTO[] = [];
  vehicles: VehicleResponseDTO[] = [];

  selectedItem: InventoryItemResponseDTO | null = null;

  page = 0;
  totalElements = 0;
  searchQuery = '';
  salePreview = '—';

  fmtCurrency = formatCurrency;
  fmtDate = formatDate;

  // 3. Tipando o parâmetro da função
  calcSalePrice = (i: InventoryItemResponseDTO) => {
    const acq = i.acquisitionPrice ?? 0;
    const m = i.profitMargin ?? 0;
    return m > 0 ? formatCurrency(acq * (1 + m / 100)) : '—';
  };

  form = this.fb.group({
    vehicleId: ['', Validators.required],
    licensePlate: [''],
    chassis: [''],
    supplier: [''],
    acquisitionPrice: [0, [Validators.required, Validators.min(0)]],
    profitMargin: [0, [Validators.required, Validators.min(0)]],
    stockEntryDate: [''],
    stockExitDate: [''],
  });

  editForm = this.fb.group({
    licensePlate: [''],
    chassis: [''],
    supplier: [''],
    acquisitionPrice: [0, [Validators.required, Validators.min(0)]],
    profitMargin: [0, [Validators.required, Validators.min(0)]],
    stockEntryDate: [''],
    stockExitDate: [''],
  });

  ngOnInit(): void {
    this.load();
    this.loadVehicles();
  }

  private cacheKey(page: number): string {
    return `inventory_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      // 4. Tipando o retorno do cache corretamente
      const cached = this.cache.get<{ items: InventoryItemResponseDTO[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;
      this.applyFilter();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    // 5. Removendo o cast de (r as any)
    this.svc.getAll(page).subscribe({
      next: (r: PagedResponse<InventoryItemResponseDTO>) => {
        // Acessando a chave do HATEOAS usando a notação de colchetes
        this.items = r._embedded?.['inventoryItemResponseDTOList'] ?? [];
        this.totalElements = r.page?.totalElements ?? 0;

        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.applyFilter();
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

  loadVehicles(): void {
    const key = 'vehicles_all';

    if (this.cache.has(key)) {
      this.vehicles = this.cache.get<VehicleResponseDTO[]>(key)!;
      this.cdr.markForCheck();
      return;
    }

    // Usando PagedResponse diretamente
    this.vehSvc.getAll(0, 200).subscribe((r: PagedResponse<VehicleResponseDTO>) => {
      this.vehicles = r._embedded?.['vehicleResponseDTOList'] ?? [];

      this.cache.set(key, this.vehicles);
      this.cdr.markForCheck();
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase();
    this.filtered = !q
      ? [...this.items]
      : this.items.filter((i) =>
          `${i.vehicle?.brand} ${i.vehicle?.model} ${i.licensePlate} ${i.chassis}`
            .toLowerCase()
            .includes(q),
        );
  }

  onSearch(): void {
    this.applyFilter();
    this.cdr.markForCheck();
  }

  isInvalidCreate(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  isInvalidEdit(controlName: keyof typeof this.editForm.controls): boolean {
    const control = this.editForm.controls[controlName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  openView(i: InventoryItemResponseDTO): void {
    this.selectedItem = i;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(i: InventoryItemResponseDTO): void {
    this.selectedItem = i;
    this.editForm.reset({
      licensePlate: i.licensePlate ?? '',
      chassis: i.chassis ?? '',
      supplier: i.supplier ?? '',
      acquisitionPrice: i.acquisitionPrice ?? 0,
      profitMargin: i.profitMargin ?? 0,
      stockEntryDate: i.stockEntryDate ? i.stockEntryDate.substring(0, 10) : '',
      stockExitDate: i.stockExitDate ? i.stockExitDate.substring(0, 10) : '',
    });
    this.calcEditPreview();
    this.editModalOpen = true;
    this.cdr.markForCheck();
  }

  calcPreview(): void {
    const acq = this.form.value.acquisitionPrice ?? 0;
    const m = this.form.value.profitMargin ?? 0;
    this.salePreview = m > 0 ? formatCurrency(acq * (1 + m / 100)) : '—';
    this.cdr.markForCheck();
  }

  calcEditPreview(): void {
    const acq = this.editForm.value.acquisitionPrice ?? 0;
    const m = this.editForm.value.profitMargin ?? 0;
    this.salePreview = m > 0 ? formatCurrency(acq * (1 + m / 100)) : '—';
    this.cdr.markForCheck();
  }

  openNew(): void {
    this.form.reset({
      vehicleId: '',
      licensePlate: '',
      chassis: '',
      supplier: '',
      acquisitionPrice: 0,
      profitMargin: 0,
      stockEntryDate: '',
      stockExitDate: '',
    });
    this.salePreview = '—';
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatorios antes de salvar.');
      this.cdr.markForCheck();
      return;
    }

    const v = this.form.value;

    // 6. Construindo o DTO de Input e garantindo a compatibilidade de tipos
    const body: InventoryItemRequest = {
      vehicleId: v.vehicleId ?? '',
      licensePlate: v.licensePlate ?? undefined,
      chassis: v.chassis ?? undefined,
      supplier: v.supplier ?? undefined,
      acquisitionPrice: v.acquisitionPrice ?? 0,
      profitMargin: v.profitMargin ?? 0,
      stockEntryDate: v.stockEntryDate || undefined,
      stockExitDate: v.stockExitDate || undefined,
    };

    // Removido o (body as any)
    this.svc.create(body).subscribe({
      next: () => {
        this.toast.success('Item adicionado!');
        this.modalOpen = false;
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e: { message?: string }) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  saveEdit(): void {
    if (!this.selectedItem?.id) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toast.error('Revise os campos obrigatorios antes de salvar.');
      this.cdr.markForCheck();
      return;
    }

    const v = this.editForm.value;
    const body: InventoryItemPatchRequest = {
      licensePlate: v.licensePlate || undefined,
      chassis: v.chassis || undefined,
      supplier: v.supplier || undefined,
      acquisitionPrice: v.acquisitionPrice ?? 0,
      profitMargin: v.profitMargin ?? 0,
      stockEntryDate: v.stockEntryDate || undefined,
      stockExitDate: v.stockExitDate || undefined,
    };

    this.svc.update(this.selectedItem.id, body).subscribe({
      next: () => {
        this.toast.success('Item atualizado com sucesso!');
        this.editModalOpen = false;
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e: { message?: string }) => this.toast.error(e?.message ?? 'Erro ao atualizar'),
    });
  }

  // 7. Tipando a função de apagar (substituindo o any)
  async delete(i: InventoryItemResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: 'Remover do estoque?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;

    // Passando o ID garantido com non-null assertion (!) pois sabemos que DTOs que vêm do back sempre têm ID
    this.svc.delete(i.id!).subscribe({
      next: () => {
        this.toast.success('Removido!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e: { message?: string }) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}
