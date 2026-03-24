import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import {
  formatCurrency,
  formatDate,
  contractStatusClass,
  contractStatusLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
import { ContractService } from '../../services/contract.service';
import { SaleService } from '../../services/sale.service';
import { EntityActions } from '../../shared/components/entity-actions/entity-actions';
import {
  ContractPatchRequest,
  ContractRequest,
  ContractResponseDTO,
  PagedResponse,
  SaleResponseDTO,
} from '../../shared/interfaces';

@Component({
  selector: 'app-contracts',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination, EntityActions],
  templateUrl: './contracts.html',
  styleUrl: './contracts.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contracts implements OnInit {
  private svc     = inject(ContractService);
  private saleSvc = inject(SaleService);
  private toast   = inject(ToastService);
  private cache   = inject(CacheService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  viewModalOpen = false;
  items:  ContractResponseDTO[] = [];
  sales:  SaleResponseDTO[] = [];
  page          = 0;
  totalElements = 0;
  editId = '';
  selectedContract: ContractResponseDTO | null = null;

  fmtCurrency = formatCurrency;
  fmtDate     = formatDate;
  statusClass = contractStatusClass;
  statusLabel = contractStatusLabel;

  form = this.fb.group({
    contractNumber: ['', Validators.required],
    contractType:   ['', Validators.required],
    contractDate:   ['', Validators.required],
    deliveryDate:   ['', Validators.required],
    totalAmount:    [0, Validators.required],
    paymentTerms:   ['CASH', Validators.required],
    contractStatus: ['PENDING'],
    saleId:         ['', Validators.required],
    notes:          [''],
    attachments:    [''],
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `contracts_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: ContractResponseDTO[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r: PagedResponse<ContractResponseDTO>) => {
        this.items         = r._embedded?.['contractResponseDTOList'] ?? [];
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

  openNew(): void {
    const salesKey = 'sales_all';
    this.editId = '';
    this.selectedContract = null;
    if (this.cache.has(salesKey)) {
      this.sales = this.cache.get<SaleResponseDTO[]>(salesKey)!;
      this.cdr.markForCheck();
    } else {
      this.saleSvc.getAll(0, 200).subscribe((r: PagedResponse<SaleResponseDTO>) => {
        this.sales = r._embedded?.['saleResponseDTOList'] ?? [];
        this.cache.set(salesKey, this.sales);
        this.cdr.markForCheck();
      });
    }

    this.form.reset({ paymentTerms: 'CASH', contractStatus: 'PENDING', totalAmount: 0 });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openView(c: ContractResponseDTO): void {
    this.selectedContract = c;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(c: ContractResponseDTO): void {
    this.selectedContract = c;
    this.editId = c.id ?? '';
    this.form.reset({
      contractNumber: c.contractNumber ?? '',
      contractType: c.contractType ?? '',
      contractDate: c.contractDate ? c.contractDate.substring(0, 10) : '',
      deliveryDate: c.deliveryDate ? c.deliveryDate.substring(0, 10) : '',
      totalAmount: c.totalAmount ?? 0,
      paymentTerms: c.paymentTerms ?? 'CASH',
      contractStatus: c.contractStatus ?? 'PENDING',
      saleId: c.sale?.id ?? '',
      notes: c.notes ?? '',
      attachments: c.attachments ?? '',
    });
    this.openNewSalesCacheOnly();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  private openNewSalesCacheOnly(): void {
    const salesKey = 'sales_all';
    if (this.cache.has(salesKey)) {
      this.sales = this.cache.get<SaleResponseDTO[]>(salesKey)!;
      return;
    }
    this.saleSvc.getAll(0, 200).subscribe((r: PagedResponse<SaleResponseDTO>) => {
      this.sales = r._embedded?.['saleResponseDTOList'] ?? [];
      this.cache.set(salesKey, this.sales);
      this.cdr.markForCheck();
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios antes de salvar.');
      this.cdr.markForCheck();
      return;
    }

    const v    = this.form.value;
    const body: ContractRequest = {
      contractNumber: v.contractNumber ?? '',
      contractType:   v.contractType ?? '',
      contractDate:   v.contractDate ?? '',
      deliveryDate:   v.deliveryDate ?? '',
      totalAmount:    v.totalAmount ?? 0,
      paymentTerms:   (v.paymentTerms ?? 'CASH') as ContractRequest['paymentTerms'],
      contractStatus: (v.contractStatus ?? undefined) as ContractRequest['contractStatus'],
      notes:          v.notes ?? undefined,
      attachments:    v.attachments ?? undefined,
      saleId:         v.saleId ?? '',
    };

    const request = this.editId
      ? this.svc.update(this.editId, {
          contractStatus: (v.contractStatus ?? undefined) as ContractPatchRequest['contractStatus'],
          deliveryDate: v.deliveryDate ?? undefined,
          notes: v.notes ?? undefined,
        } as Partial<ContractPatchRequest>)
      : this.svc.create(body);

    request.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Contrato atualizado!' : 'Contrato criado!');
        this.modalOpen = false;
        this.editId = '';
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(c: ContractResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir contrato?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(c.id!).subscribe({
      next: () => {
        this.toast.success('Contrato excluído!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}
