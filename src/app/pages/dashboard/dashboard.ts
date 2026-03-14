import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import {
  formatCurrency,
  formatDate,
  aptTypeLabel,
  aptTypeClass,
  aptStatusLabel,
  aptStatusClass,
} from '../../shared/helpers/formatters.helper';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);

  loading = true;
  stats = this.buildStats(0, 0, 0, 0);
  appointments: any[] = [];
  branches: any[] = [];

  fmtDate = formatDate;
  aptTypeLabel = aptTypeLabel;
  aptTypeClass = aptTypeClass;
  aptStatusLabel = aptStatusLabel;
  aptStatusClass = aptStatusClass;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      v: this.api.getAll('/vehicles', 0, 1).pipe(catchError(() => of(null))),
      inv: this.api.getAll('/inventory-items', 0, 1).pipe(catchError(() => of(null))),
      s: this.api.getAll('/sales', 0, 1).pipe(catchError(() => of(null))),
      c: this.api.getAll('/customers', 0, 1).pipe(catchError(() => of(null))),
      apt: this.api.getAll('/appointments', 0, 5).pipe(catchError(() => of(null))),
      br: this.api.getAll('/branches', 0, 6).pipe(catchError(() => of(null))),
    }).subscribe((res) => {
      this.stats = this.buildStats(
        (res.v as any)?.page?.totalElements ?? 0,
        (res.inv as any)?.page?.totalElements ?? 0,
        (res.s as any)?.page?.totalElements ?? 0,
        (res.c as any)?.page?.totalElements ?? 0,
      );
      this.appointments = (res.apt as any)?._embedded?.appointmentResponseDTOList ?? [];
      const brRaw = res.br as any;
      this.branches =
        brRaw?._embedded?.branchResponseDTOList ?? (Array.isArray(brRaw) ? brRaw : []);
      this.loading = false;
    });
  }

  private buildStats(v: number, inv: number, s: number, c: number) {
    return [
      {
        label: 'Veículos',
        emoji: '🚗',
        value: v,
        sub: 'Total cadastrado',
        iconBg: 'rgba(234,88,12,0.1)',
      },
      {
        label: 'Estoque',
        emoji: '📦',
        value: inv,
        sub: 'Itens em estoque',
        iconBg: 'rgba(37,99,235,0.1)',
      },
      {
        label: 'Vendas',
        emoji: '💰',
        value: s,
        sub: 'Total de vendas',
        iconBg: 'rgba(22,163,74,0.1)',
      },
      {
        label: 'Clientes',
        emoji: '👥',
        value: c,
        sub: 'Cadastrados',
        iconBg: 'rgba(124,58,237,0.1)',
      },
    ];
  }
}
