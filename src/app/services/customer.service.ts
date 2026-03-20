import { Injectable } from '@angular/core';
import { Customer } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<Customer>('/customers', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Customer>('/customers', id);
  }

  create(c: Customer) {
    return this.api.create<Customer>('/customers', c);
  }

  update(id: string, c: Partial<Customer>) {
    return this.api.update<Customer>('/customers', id, c);
  }

  delete(id: string) {
    return this.api.remove('/customers', id);
  }
}
