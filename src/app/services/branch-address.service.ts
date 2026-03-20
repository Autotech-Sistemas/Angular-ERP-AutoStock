import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class BranchAddressService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<any>('/branches-address', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<any>('/branches-address', id);
  }

  create(b: any) {
    return this.api.create<any>('/branches-address', b);
  }

  update(id: string, b: any) {
    return this.api.update<any>('/branches-address', id, b);
  }

  delete(id: string) {
    return this.api.remove('/branches-address', id);
  }
}
