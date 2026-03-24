import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectionOption } from '../../interfaces';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-record-picker',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './record-picker.html',
  styleUrl: './record-picker.css',
})
export class RecordPicker {
  @Input() open = false;
  @Input() title = 'Selecionar registro';
  @Input() searchPlaceholder = 'Buscar...';
  @Input() emptyText = 'Nenhum registro encontrado.';
  @Input() options: SelectionOption[] = [];
  @Input() selectedId = '';

  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();

  searchQuery = '';

  get filteredOptions(): SelectionOption[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.options;
    return this.options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query),
    );
  }

  onClose(): void {
    this.searchQuery = '';
    this.close.emit();
  }

  pick(id: string): void {
    this.searchQuery = '';
    this.select.emit(id);
  }
}
