import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Admin, AdminRegisterRequest } from '../shared/interfaces/models.interface';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private api: ApiService) {}
  getAll() {
    return this.api.getAll<Admin>('/adm');
  }

  getById(id: string) {
    return this.api.getById<Admin>('/adm', id);
  }

  create(a: AdminRegisterRequest) {
    return this.api.create<Admin>('/adm', a);
  }

  update(id: string, a: Partial<Admin>) {
    return this.api.update<Admin>('/adm', id, a);
  }

  delete(id: string) {
    return this.api.remove('/adm', id);
  }
}
