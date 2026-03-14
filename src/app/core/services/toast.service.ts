import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private counter = 0;

  show(message: string, type: ToastMessage['type'] = 'success'): void {
    const id = ++this.counter;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3500);
  }

  success(msg: string): void { this.show(msg, 'success'); }
  error(msg: string):   void { this.show(msg, 'error'); }
  warning(msg: string): void { this.show(msg, 'warning'); }
  info(msg: string):    void { this.show(msg, 'info'); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
