import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none"
         role="region" aria-label="Notificações" aria-live="polite">
      @for (t of svc.toasts(); track t.id) {
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto
                    min-w-[260px] max-w-sm animate-slide-in-right"
             [class]="toastClass(t.type)"
             role="alert">
          <span class="text-lg flex-shrink-0" aria-hidden="true">{{ toastIcon(t.type) }}</span>
          <span class="text-sm font-medium flex-1" style="font-family: 'DM Sans', sans-serif">{{ t.message }}</span>
          <button class="opacity-60 hover:opacity-100 transition-opacity text-base leading-none ml-1"
                  (click)="svc.dismiss(t.id)"
                  [attr.aria-label]="'Fechar: ' + t.message">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  svc = inject(ToastService);

  toastClass(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-900/90 text-emerald-100 border border-emerald-700/50',
      error:   'bg-red-900/90 text-red-100 border border-red-700/50',
      warning: 'bg-amber-900/90 text-amber-100 border border-amber-700/50',
      info:    'bg-blue-900/90 text-blue-100 border border-blue-700/50',
    };
    return map[type] ?? map['info'];
  }

  toastIcon(type: string): string {
    const map: Record<string, string> = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
    };
    return map[type] ?? 'ℹ';
  }
}
