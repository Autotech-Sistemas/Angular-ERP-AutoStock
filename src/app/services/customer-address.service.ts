import { Injectable } from '@angular/core';
import { CustomerAddress } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerAddressService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<CustomerAddress>('/customers-address', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<CustomerAddress>('/customers-address', id);
  }

  create(c: CustomerAddress) {
    return this.api.create<CustomerAddress>('/customers-address', c);
  }

  update(id: string, c: Partial<CustomerAddress>) {
    return this.api.update<CustomerAddress>('/customers-address', id, c);
  }

  delete(id: string) {
    return this.api.remove('/customers-address', id);
  }
}
