import { Injectable } from '@angular/core';
import { Sale } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<Sale>('/sales', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Sale>('/sales', id);
  }

  create(s: Sale) {
    return this.api.create<Sale>('/sales', s);
  }

  update(id: string, s: Partial<Sale>) {
    return this.api.update<Sale>('/sales', id, s);
  }

  delete(id: string) {
    return this.api.remove('/sales', id);
  }
}
