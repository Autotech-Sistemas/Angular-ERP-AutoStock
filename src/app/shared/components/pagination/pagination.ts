import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination implements OnChanges {
  @Input() totalElements = 0;
  @Input() pageSize = 12;
  @Input() currentPage = 0;
  @Output() pageChange = new EventEmitter<number>();

  totalPages = 0;
  pages: number[] = [];

  ngOnChanges(): void {
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);
    const max = Math.min(this.totalPages, 7);
    const start = Math.max(0, Math.min(this.currentPage - 3, this.totalPages - max));
    this.pages = Array.from({ length: max }, (_, i) => start + i);
  }

  go(p: number): void {
    if (p >= 0 && p < this.totalPages) this.pageChange.emit(p);
  }
}
