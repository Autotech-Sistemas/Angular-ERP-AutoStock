import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatCurrency, formatDate, maskPhone } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Modal } from '../../shared/components/modal/modal';
import { SellerService } from '../../services/seller.service';
import { PagedResponse, SellerRegisterRequest, SellerResponseDTO } from '../../shared/interfaces';
import { EntityActions } from '../../shared/components/entity-actions/entity-actions';

@Component({
  selector: 'app-sellers',
  imports: [CommonModule, ReactiveFormsModule, Modal, Pagination, EntityActions],
  templateUrl: './sellers.html',
  styleUrl: './sellers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sellers implements OnInit {
  private svc   = inject(SellerService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb    = inject(FormBuilder);
  private cdr   = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  viewModalOpen = false;
  saving        = false;
  items:  SellerResponseDTO[] = [];
  page          = 0;
  totalElements = 0;
  editId = '';
  selectedSeller: SellerResponseDTO | null = null;

  fmtCurrency = formatCurrency;
  fmtDate = formatDate;

  form = this.fb.group({
    name:           ['', Validators.required],
    email:          ['', Validators.required],
    password:       ['', Validators.required],
    phone:          [''],
    hireDate:       ['', Validators.required],
    salary:         [0, Validators.required],
    commissionRate: [0, Validators.required],
  });

  ngOnInit(): void { this.load(); }

  private cacheKey(page: number): string {
    return `sellers_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: SellerResponseDTO[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      if (!this.cache.has('sellers_all')) this.cache.set('sellers_all', this.items);
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (r: PagedResponse<SellerResponseDTO>) => {
        this.items         = r._embedded?.['sellerResponseDTOList'] ?? [];
        this.totalElements = r.page?.totalElements ?? 0;
        this.cache.set(key, { items: this.items, total: this.totalElements });
        this.cache.set('sellers_all', this.items);
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
    this.cache.invalidate('sellers_all');
    this.load(this.page, true);
  }

  openNew(): void {
    this.editId = '';
    this.selectedSeller = null;
    this.form.reset({ salary: 0, commissionRate: 0 });
    this.form.controls.password.setValidators([Validators.required]);
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  openView(s: SellerResponseDTO): void {
    this.selectedSeller = s;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(s: SellerResponseDTO): void {
    this.editId = s.id ?? '';
    this.selectedSeller = s;
    this.form.reset({
      name: s.name ?? '',
      email: s.email ?? '',
      password: '',
      phone: s.phone ?? '',
      hireDate: s.hireDate ? s.hireDate.substring(0, 10) : '',
      salary: s.salary ?? 0,
      commissionRate: s.commissionRate ?? 0,
    });
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  onPhone(e: Event): void {
    const t = e.target as HTMLInputElement;
    t.value = maskPhone(t.value);
    this.form.patchValue({ phone: t.value });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Preencha os campos obrigatórios antes de salvar.');
      this.cdr.markForCheck();
      return;
    }

    this.saving = true;
    const body: SellerRegisterRequest = {
      name: this.form.value.name ?? '',
      email: this.form.value.email ?? '',
      phone: this.form.value.phone ?? undefined,
      hireDate: this.form.value.hireDate ?? undefined,
      salary: this.form.value.salary ?? 0,
      commissionRate: this.form.value.commissionRate ?? 0,
    };
    if (!this.editId) {
      body.password = this.form.value.password ?? undefined;
    }

    const request = this.editId
      ? this.svc.update(this.editId, body)
      : this.svc.create(body);

    request.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Vendedor atualizado!' : 'Vendedor cadastrado!');
        this.modalOpen = false;
        this.saving = false;
        this.editId = '';
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  async delete(s: SellerResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${s.name}?`, icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(s.id!).subscribe({
      next: () => {
        this.toast.success('Vendedor excluído!');
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
    this.cache.invalidate('sellers_all');
  }
}
