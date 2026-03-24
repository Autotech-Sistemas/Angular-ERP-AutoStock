import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-entity-actions',
  imports: [CommonModule],
  templateUrl: './entity-actions.html',
  styleUrl: './entity-actions.css',
})
export class EntityActions {
  @Input() viewTitle = 'Ver detalhes';
  @Input() editLabel = 'Editar';
  @Input() deleteLabel = 'Excluir';
  @Input() viewAriaLabel?: string;
  @Input() editAriaLabel?: string;
  @Input() deleteAriaLabel?: string;
  @Input() showView = true;
  @Input() showEdit = true;
  @Input() showDelete = true;

  @Output() view = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}
