import { Injectable } from '@angular/core';
import { Appointment, AppointmentResponse, AppointmentResponseDTO } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

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

  create(a: Appointment) {
    return this.api.create<AppointmentResponseDTO>('/appointments', a);
  }

  update(id: string, a: Partial<Appointment>) {
    return this.api.update<AppointmentResponseDTO>('/appointments', id, a);
  }

  delete(id: string) {
    return this.api.remove('/appointments', id);
  }
}
