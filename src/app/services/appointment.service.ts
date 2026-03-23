import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppointmentRequest, AppointmentPatchRequest, AppointmentResponseDTO } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<AppointmentResponseDTO>('/appointments', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<AppointmentResponseDTO>('/appointments', id);
  }

  create(a: AppointmentRequest) {
    return this.api.create<AppointmentResponseDTO>('/appointments', a);
  }

  update(id: string, a: AppointmentPatchRequest) {
    return this.api.update<AppointmentResponseDTO>('/appointments', id, a);
  }

  delete(id: string) {
    return this.api.remove('/appointments', id);
  }
}