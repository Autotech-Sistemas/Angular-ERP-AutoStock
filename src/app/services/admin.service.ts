import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AdminResponseDTO, AdminRegisterRequest, Admin } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private api: ApiService) {}
  getAll() {
    return this.api.getAll<AdminResponseDTO>('/adm');
  }

  getById(id: string) {
    return this.api.getById<AdminResponseDTO>('/adm', id);
  }

  create(a: AdminRegisterRequest) {
    return this.api.create<AdminResponseDTO>('/adm', a);
  }

  update(id: string, a: Partial<Admin>) {
    return this.api.update<AdminResponseDTO>('/adm', id, a);
  }

  delete(id: string) {
    return this.api.remove('/adm', id);
  }
}
