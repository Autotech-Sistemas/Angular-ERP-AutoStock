import { Injectable } from '@angular/core';
import { Vehicle, VehicleResponseDTO } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  constructor(private api: ApiService) {}
  
  getAll(page = 0, size = 12, direction = 'asc') {
	return this.api.getAll<VehicleResponseDTO>('/vehicles', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<VehicleResponseDTO>('/vehicles', id);
  }

  create(v: Vehicle) {
    return this.api.create<VehicleResponseDTO>('/vehicles', v);
  }

  update(id: string, v: Partial<Vehicle>) {
    return this.api.update<VehicleResponseDTO>('/vehicles', id, v);
  }

  delete(id: string) {
    return this.api.remove('/vehicles', id);
  }
}
