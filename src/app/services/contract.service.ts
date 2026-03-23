import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ContractRequest, ContractPatchRequest, ContractResponseDTO } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<ContractResponseDTO>('/contracts', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<ContractResponseDTO>('/contracts', id);
  }

  create(c: ContractRequest) {
    return this.api.create<ContractResponseDTO>('/contracts', c);
  }

  update(id: string, c: Partial<ContractPatchRequest>) {
    return this.api.update<ContractResponseDTO>('/contracts', id, c);
  }

  delete(id: string) {
    return this.api.remove('/contracts', id);
  }
}
