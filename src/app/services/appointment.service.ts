import { Injectable } from '@angular/core';
import { Appointment } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<Appointment>('/appointments', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<Appointment>('/appointments', id);
  }

  create(a: Appointment) {
    return this.api.create<Appointment>('/appointments', a);
  }

  update(id: string, a: Partial<Appointment>) {
    return this.api.update<Appointment>('/appointments', id, a);
  }

  delete(id: string) {
    return this.api.remove('/appointments', id);
  }
}
