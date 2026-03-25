import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import {
  formatDate,
  aptTypeClass,
  aptTypeLabel,
  aptStatusClass,
  aptStatusLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
import { AppointmentService } from '../../services/appointment.service';
import { CustomerService } from '../../services/customer.service';
import { SellerService } from '../../services/seller.service';
import { EntityActions } from '../../shared/components/entity-actions/entity-actions';
import {
  AppointmentResponseDTO,
  CustomerResponseDTO,
  SellerResponseDTO,
  PagedResponse,
  AppointmentStatus,
  AppointmentType,
  AppointmentRequest,
} from '../../shared/interfaces';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, Modal, Pagination, EntityActions],
  templateUrl: './appointments.html',
  styleUrl: './appointments.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Appointments implements OnInit {
  private svc = inject(AppointmentService);
  private custSvc = inject(CustomerService);
  private selSvc = inject(SellerService);
  private toast = inject(ToastService);
  private cache = inject(CacheService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  modalOpen = false;
  viewModalOpen = false;
  items: AppointmentResponseDTO[] = [];
  customers: CustomerResponseDTO[] = [];
  sellers: SellerResponseDTO[] = [];
  page = 0;
  totalElements = 0;
  editId = '';
  selectedAppointment: AppointmentResponseDTO | null = null;

  fmtDate = formatDate;
  aptTypeClass = aptTypeClass;
  aptTypeLabel = aptTypeLabel;
  aptStatusClass = aptStatusClass;
  aptStatusLabel = aptStatusLabel;

  form = this.fb.group({
    customerId: ['', Validators.required],
    sellerId: ['', Validators.required],
    date: ['', Validators.required],
    appointmentType: ['TEST_DRIVE', Validators.required],
    appointmentStatus: ['PENDING'],
  });

  ngOnInit(): void {
    this.load();
  }

  private cacheKey(page: number): string {
    return `appointments_page_${page}`;
  }

  load(page = 0, forceRefresh = false): void {
    this.page = page;
    const key = this.cacheKey(page);

    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get<{ items: AppointmentResponseDTO[]; total: number }>(key)!;
      this.items = cached.items;
      this.totalElements = cached.total;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.svc.getAll(page).subscribe({
      next: (response) => {
        const r = response as unknown as PagedResponse<AppointmentResponseDTO>;
        this.items = r._embedded?.['appointmentResponseDTOList'] ?? [];
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
    this.editId = '';
    this.selectedAppointment = null;
    const custKey = 'customers_all';
    const selKey = 'sellers_all';

    if (this.cache.has(custKey)) {
      this.customers = this.cache.get<CustomerResponseDTO[]>(custKey)!;
    } else {
      this.custSvc
        .getAll(0, 200)
        .pipe(catchError(() => of(null)))
        .subscribe((response) => {
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
      this.selSvc
        .getAll(0, 200)
        .pipe(catchError(() => of(null)))
        .subscribe((response) => {
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

  openView(a: AppointmentResponseDTO): void {
    this.selectedAppointment = a;
    this.viewModalOpen = true;
    this.cdr.markForCheck();
  }

  openEdit(a: AppointmentResponseDTO): void {
    this.selectedAppointment = a;
    this.editId = a.id ?? '';
    this.openNew();
    this.editId = a.id ?? '';
    this.selectedAppointment = a;
    this.form.reset({
      customerId: a.customer?.id ?? '',
      sellerId: a.seller?.id ?? '',
      date: a.date ? a.date.substring(0, 10) : '',
      appointmentType: a.appointmentType ?? 'TEST_DRIVE',
      appointmentStatus: a.appointmentStatus ?? 'PENDING',
    });
    this.modalOpen = true;
    this.cdr.markForCheck();
  }

  updateStatus(a: AppointmentResponseDTO, newStatus: string): void {
    const status = newStatus as AppointmentStatus;

    const body: AppointmentRequest = {
      date: a.date!,
      appointmentType: a.appointmentType!,
      appointmentStatus: status,
      customerId: a.customer?.id ?? '',
      sellerId: a.seller?.id ?? '',
    };

    this.cache.invalidate(this.cacheKey(this.page));
    this.svc.update(a.id!, body).subscribe({
      next: () => {
        this.toast.info('Status atualizado!');
      },
      error: (e) => {
        const msg = e?.error?.message || 'Não foi possível atualizar o status. Tente novamente mais tarde.';
        this.toast.error(msg);
        this.load(this.page, true); // Recarrega a tabela para reverter o select visualmente
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const body: AppointmentRequest = {
      date: v.date!,
      appointmentType: v.appointmentType as AppointmentType,
      appointmentStatus: v.appointmentStatus as AppointmentStatus,
      customerId: v.customerId!,
      sellerId: v.sellerId!,
    };

    const request = this.editId ? this.svc.update(this.editId, body) : this.svc.create(body);

    request.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Agendamento atualizado!' : 'Agendamento criado!');
        this.modalOpen = false;
        this.editId = '';
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Não foi possível salvar o agendamento. Verifique os dados e tente novamente.';
        this.toast.error(msg);
        this.cdr.markForCheck();
      },
    });
  }

  async delete(a: AppointmentResponseDTO): Promise<void> {
    const r = await Swal.fire({
      title: 'Excluir agendamento?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;

    this.svc.delete(a.id!).subscribe({
      next: () => {
        this.toast.success('Agendamento excluído!');
        this.invalidateAllPages();
        this.load(this.page, true);
      },
      error: (e) => {
        const msg = e?.error?.message || 'Não foi possível excluir este agendamento. Ele pode estar vinculado a outros registros.';
        this.toast.error(msg);
      },
    });
  }

  private invalidateAllPages(): void {
    for (let i = 0; i <= Math.ceil(this.totalElements / 12); i++) {
      this.cache.invalidate(this.cacheKey(i));
    }
  }
}
