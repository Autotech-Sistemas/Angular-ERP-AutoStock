import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { CustomerResponseDTO, Customer } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<CustomerResponseDTO>('/customers', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<CustomerResponseDTO>('/customers', id);
  }

  create(c: Customer) {
    return this.api.create<CustomerResponseDTO>('/customers', c);
  }

  update(id: string, c: Partial<Customer>) {
    return this.api.update<CustomerResponseDTO>('/customers', id, c);
  }

  delete(id: string) {
    return this.api.remove('/customers', id);
  }
}
