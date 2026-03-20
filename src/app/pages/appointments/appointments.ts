import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { formatDate, aptTypeClass, aptTypeLabel, aptStatusClass, aptStatusLabel } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
import {
  AppointmentResponseDTO,
  CustomerResponseDTO,
  SellerResponseDTO,
  PagedResponse,
  Appointment,
  AppointmentType,
  AppointmentStatus
} from '../../shared/interfaces/models.interface';
import { AppointmentService } from '../../services/appointment.service';
import { CustomerService } from '../../services/customer.service';
import { SellerService } from '../../services/seller.service';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointments implements OnInit {
  private svc     = inject(AppointmentService);
  private custSvc = inject(CustomerService);
  private selSvc  = inject(SellerService);
  private toast   = inject(ToastService);
  private cache   = inject(CacheService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);

  loading       = false;
  modalOpen     = false;
  items:        AppointmentResponseDTO[] = [];
  customers:    CustomerResponseDTO[]    = [];
  sellers:      SellerResponseDTO[]      = [];
  page          = 0;
  totalElements = 0;

  fmtDate        = formatDate;
  aptTypeClass   = aptTypeClass;
  aptTypeLabel   = aptTypeLabel;
  aptStatusClass = aptStatusClass;
  aptStatusLabel = aptStatusLabel;

  form = this.fb.group({
    customerId:        ['', Validators.required],
    sellerId:          ['', Validators.required],
    date:              ['', Validators.required],
    appointmentType:   ['TEST_DRIVE', Validators.required],
    appointmentStatus: ['PENDING'],
  });

  ngOnInit(): void { this.load(); }

  private cacheKey(page: number): string {
    return `appointments_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: AppointmentResponseDTO[]; total: number }>(key)!;
      this.items         = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (response) => {
        const r = response as unknown as PagedResponse<AppointmentResponseDTO>;
        this.items         = r._embedded?.['appointmentResponseDTOList'] ?? [];
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
    const custKey = 'customers_all';
    const selKey  = 'sellers_all';

    if (this.cache.has(custKey)) {
      this.customers = this.cache.get<CustomerResponseDTO[]>(custKey)!;
    } else {
      this.custSvc.getAll(0, 200).pipe(catchError(() => of(null))).subscribe(response => {
        if (response) {
          const r = response as unknown as PagedResponse<CustomerResponseDTO>;
          this.customers = r._embedded?.['customerResponseDTOList'] ?? [];
          this.cache.set(custKey, this.customers);
        }
        this.cdr.markForCheck();
      });
    }

    if (this.cache.has(selKey)) {
      this.sellers = this.cache.get<SellerResponseDTO[]>(selKey)!;
    } else {
      this.selSvc.getAll(0, 200).pipe(catchError(() => of(null))).subscribe(response => {
        if (response) {
          const r = response as unknown as PagedResponse<SellerResponseDTO>;
          this.sellers = r._embedded?.['sellerResponseDTOList'] ?? [];
          this.cache.set(selKey, this.sellers);
        }
        this.cdr.markForCheck();
      });
    }

    this.form.reset({ appointmentType: 'TEST_DRIVE', appointmentStatus: 'PENDING' });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  updateStatus(a: AppointmentResponseDTO, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as AppointmentStatus;
    
    this.cache.invalidate(this.cacheKey(this.page));
    this.svc.update(a.id!, { appointmentStatus: status }).subscribe({
      next: () => this.toast.info('Status atualizado!'),
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    
    const v    = this.form.value;
    const body: Partial<Appointment> = {
      date:              v.date ?? undefined,
      appointmentType:   (v.appointmentType as AppointmentType) ?? undefined,
      appointmentStatus: (v.appointmentStatus as AppointmentStatus) ?? undefined,
      customer:          { id: v.customerId ?? undefined },
      seller:            { id: v.sellerId ?? undefined },
    };

    this.svc.create(body as Appointment).subscribe({
      next: () => {
        this.toast.success('Agendamento criado!');
        this.modalOpen = false;
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.cdr.markForCheck();
      },
    });
  }

  async delete(a: AppointmentResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir agendamento?', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sim',
      cancelButtonText: 'Não', confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    
    this.svc.delete(a.id!).subscribe({
      next: () => {
        this.toast.success('Agendamento excluído!');
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