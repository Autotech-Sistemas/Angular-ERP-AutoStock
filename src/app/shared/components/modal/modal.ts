import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  @Input() title = '';
  @Input() open = false;
  @Output() closeModal = new EventEmitter<void>();

  onOverlayClick(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.closeModal.emit();
  }
}
