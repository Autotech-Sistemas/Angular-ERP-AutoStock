import { Injectable } from '@angular/core';
import { Branch } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc', assembler: boolean = true) {
    return this.api.getAll<Branch>('/branches', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Branch>('/branches', id);
  }

  create(b: Branch) {
    return this.api.create<Branch>('/branches', b);
  }

  update(id: string, b: Partial<Branch>) {
    return this.api.update<Branch>('/branches', id, b);
  }

  delete(id: string) {
    return this.api.remove('/branches', id);
  }
}
