import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { AdminService } from '../../services/business.service';
import { maskPhone } from '../../shared/helpers/formatters.helper';
import Swal from 'sweetalert2';
import { Modal } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-admins',
  imports: [CommonModule, ReactiveFormsModule, Modal],
  templateUrl: './admins.html',
  styleUrl: './admins.css',
})
export class Admins implements OnInit {
  private svc = inject(AdminService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  loading = true;
  saving = false;
  modalOpen = false;
  items: any[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    phone: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: (r) => {
        this.items = Array.isArray(r) ? r : [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openNew(): void {
    this.form.reset();
    this.modalOpen = true;
  }

  onPhone(e: Event): void {
    const t = e.target as HTMLInputElement;
    t.value = maskPhone(t.value);
    this.form.patchValue({ phone: t.value });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.svc.create(this.form.value as any).subscribe({
      next: () => {
        this.toast.success('Administrador cadastrado!');
        this.modalOpen = false;
        this.saving = false;
        this.load();
      },
      error: (e) => {
        this.toast.error(e?.message ?? 'Erro');
        this.saving = false;
      },
    });
  }

  async delete(a: any): Promise<void> {
    const r = await Swal.fire({
      title: `Excluir ${a.name}?`,
      text: 'Esta ação não pode ser desfeita.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!r.isConfirmed) return;
    this.svc.delete(a.id).subscribe({
      next: () => {
        this.toast.success('Administrador excluído!');
        this.load();
      },
      error: (e) => this.toast.error(e?.message ?? 'Erro'),
    });
  }
}
