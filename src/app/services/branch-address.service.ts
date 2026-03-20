import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BranchAddressResponseDTO } from '../shared/interfaces/models.interface';

@Injectable({
  providedIn: 'root',
})
export class BranchAddressService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<BranchAddressResponseDTO>('/branches-address', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<BranchAddressResponseDTO>('/branches-address', id);
  }

  create(b: any) {
    return this.api.create<BranchAddressResponseDTO>('/branches-address', b);
  }

  update(id: string, b: any) {
    return this.api.update<BranchAddressResponseDTO>('/branches-address', id, b);
  }

  delete(id: string) {
    return this.api.remove('/branches-address', id);
  }
}
