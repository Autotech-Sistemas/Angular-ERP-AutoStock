import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SellerResponseDTO, SellerRegisterRequest, Seller } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<SellerResponseDTO>('/sellers', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<SellerResponseDTO>('/sellers', id);
  }

  create(s: SellerRegisterRequest) {
    return this.api.create<SellerResponseDTO>('/sellers', s);
  }

  update(id: string, s: Partial<Seller>) {
    return this.api.update<SellerResponseDTO>('/sellers', id, s);
  }

  delete(id: string) {
    return this.api.remove('/sellers', id);
  }
}
