import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <nav class="flex items-center gap-1" role="navigation" aria-label="Paginação">
        <button class="page-btn" [disabled]="currentPage === 0"
                (click)="go(currentPage - 1)" aria-label="Página anterior">‹</button>

        @for (p of pages; track p) {
          <button class="page-btn" [class.active]="p === currentPage"
                  (click)="go(p)" [attr.aria-label]="'Página ' + (p+1)"
                  [attr.aria-current]="p === currentPage ? 'page' : null">
            {{ p + 1 }}
          </button>
        }

        <button class="page-btn" [disabled]="currentPage === totalPages - 1"
                (click)="go(currentPage + 1)" aria-label="Próxima página">›</button>
      </nav>
    }
  `,
})
export class PaginationComponent implements OnChanges {
  @Input() totalElements = 0;
  @Input() pageSize      = 12;
  @Input() currentPage   = 0;
  @Output() pageChange   = new EventEmitter<number>();

  totalPages = 0;
  pages: number[] = [];

  ngOnChanges(): void {
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    const max  = Math.min(this.totalPages, 7);
    const start = Math.max(0, Math.min(this.currentPage - 3, this.totalPages - max));
    this.pages = Array.from({ length: max }, (_, i) => start + i);
  }

  go(p: number): void {
    if (p >= 0 && p < this.totalPages) this.pageChange.emit(p);
  }
}
