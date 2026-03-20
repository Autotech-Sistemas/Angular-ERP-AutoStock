import { Injectable } from '@angular/core';
import { Seller, SellerRegisterRequest } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class SellerService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<Seller>('/sellers', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Seller>('/sellers', id);
  }

  create(s: SellerRegisterRequest) {
    return this.api.create<Seller>('/sellers', s);
  }

  update(id: string, s: Partial<Seller>) {
    return this.api.update<Seller>('/sellers', id, s);
  }

  delete(id: string) {
    return this.api.remove('/sellers', id);
  }
}
