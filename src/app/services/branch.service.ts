import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { BranchResponseDTO, Branch } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc', assembler: boolean = true) {
    return this.api.getAll<BranchResponseDTO>('/branches', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<BranchResponseDTO>('/branches', id);
  }

  create(b: Branch) {
    return this.api.create<BranchResponseDTO>('/branches', b);
  }

  update(id: string, b: Partial<Branch>) {
    return this.api.update<BranchResponseDTO>('/branches', id, b);
  }

  delete(id: string) {
    return this.api.remove('/branches', id);
  }
}
