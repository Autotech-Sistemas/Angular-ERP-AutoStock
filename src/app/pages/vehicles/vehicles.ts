import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { VehicleService } from '../../services/business.service';
import { ToastService } from '../../core/services/toast.service';
import { Vehicle } from '../../shared/interfaces/models.interface';
import {
  formatCurrency,
  formatDate,
  availabilityClass,
  availabilityLabel,
  vehicleStatusClass,
  vehicleStatusLabel,
  fuelLabel,
} from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent, PaginationComponent],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css',
})
export class Vehicles implements OnInit {
  private svc = inject(VehicleService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  modalOpen = false;
  items: Vehicle[] = [];
  filtered: Vehicle[] = [];
  editId = '';
  searchQuery = '';
  typeFilter = '';
  page = 0;
  totalElements = 0;

  fmtCurrency = formatCurrency;
  fmtMileage = (v: number) => (v != null ? `${Number(v).toLocaleString('pt-BR')} km` : '—');
  availClass = availabilityClass;
  availLabel = availabilityLabel;
  vehicleStatusClass = vehicleStatusClass;
  vehicleStatusLabel = vehicleStatusLabel;
  fuelLabel = fuelLabel;
  getYear = (d: string) => (d ? new Date(d).getFullYear() : '—');

  form = this.fb.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    type: ['CAR', Validators.required],
    category: ['SEDAN', Validators.required],
    manufactureYear: ['', Validators.required],
    color: ['', Validators.required],
    mileage: [0],
    weight: [0],
    fuelType: ['GASOLINE', Validators.required],
    numberOfCylinders: [4],
    enginePower: [0],
    fuelTankCapacity: [0],
    passengerCapacity: [5],
    salePrice: [0, Validators.required],
    status: ['NEW'],
    availability: ['AVAILABLE'],
    infotainmentSystem: ['', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  load(page = 0): void {
    this.loading = true;
    this.page = page;
    this.svc.getAll(page).subscribe({
      next: (r) => {
        this.items = (r as any)?._embedded?.vehicleResponseDTOList ?? [];
        this.totalElements = (r as any)?.page?.totalElements ?? 0;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearch(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.items.filter((v) => {
      const q = this.searchQuery.toLowerCase();
      const matchQ = !q || `${v.brand} ${v.model} ${v.color}`.toLowerCase().includes(q);
      const matchT = !this.typeFilter || v.type === this.typeFilter;
      return matchQ && matchT;
    });
  }

  onPage(p: number): void {
    this.load(p);
  }

  openNew(): void {
    this.editId = '';
    this.form.reset({
      type: 'CAR',
      category: 'SEDAN',
      fuelType: 'GASOLINE',
      status: 'NEW',
      availability: 'AVAILABLE',
      mileage: 0,
      weight: 0,
      numberOfCylinders: 4,
      enginePower: 0,
      fuelTankCapacity: 0,
      passengerCapacity: 5,
      salePrice: 0,
    });
    this.modalOpen = true;
  }

  openEdit(v: Vehicle): void {
    this.editId = v.id ?? '';
    this.form.patchValue({ ...v });
    this.modalOpen = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const body = this.form.value as Vehicle;
    const req = this.editId ? this.svc.update(this.editId, body) : this.svc.create(body);
    req.subscribe({
      next: () => {
        this.toast.success(this.editId ? 'Veículo atualizado!' : 'Veículo cadastrado!');
        this.modalOpen = false;
        this.saving = false;
        this.load(this.page);
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro ao salvar');
        this.saving = false;
      },
    });
  }

  async delete(v: Vehicle): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${v.brand} ${v.model}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(v.id!).subscribe({
      next: () => {
        this.toast.success('Veículo excluído!');
        this.load(this.page);
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro ao excluir'),
    });
  }
}
