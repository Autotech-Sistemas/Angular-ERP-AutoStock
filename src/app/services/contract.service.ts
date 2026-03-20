import { Injectable } from '@angular/core';
import { Contract } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<Contract>('/contracts', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Contract>('/contracts', id);
  }

  create(c: Contract) {
    return this.api.create<Contract>('/contracts', c);
  }

  update(id: string, c: Partial<Contract>) {
    return this.api.update<Contract>('/contracts', id, c);
  }

  delete(id: string) {
    return this.api.remove('/contracts', id);
  }
}
