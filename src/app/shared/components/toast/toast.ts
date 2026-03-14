import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  svc = inject(ToastService);

  toastClass(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-900/90 text-emerald-100 border border-emerald-700/50',
      error: 'bg-red-900/90 text-red-100 border border-red-700/50',
      warning: 'bg-amber-900/90 text-amber-100 border border-amber-700/50',
      info: 'bg-blue-900/90 text-blue-100 border border-blue-700/50',
    };
    return map[type] ?? map['info'];
  }

  toastIcon(type: string): string {
    const map: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return map[type] ?? 'ℹ';
  }
}
