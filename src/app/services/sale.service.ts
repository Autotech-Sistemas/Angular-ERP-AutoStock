import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SaleRequest, SalePatchRequest, SaleResponseDTO } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<SaleResponseDTO>('/sales', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<SaleResponseDTO>('/sales', id);
  }

  create(s: SaleRequest) {
    return this.api.create<SaleResponseDTO>('/sales', s);
  }

  update(id: string, s: SalePatchRequest) {
    return this.api.update<SaleResponseDTO>('/sales', id, s);
  }

  delete(id: string) {
    return this.api.remove('/sales', id);
  }
}