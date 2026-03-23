import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { VehicleSpecificDetailResponseDTO } from '../shared/interfaces';

@Injectable({
  providedIn: 'root',
})
export class VehicleSpecificDetailService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
	return this.api.getAll<VehicleSpecificDetailResponseDTO>('/vehicle-specific-details', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<VehicleSpecificDetailResponseDTO>('/vehicle-specific-details', id);
  }

  create(detail: any) {
    return this.api.create<VehicleSpecificDetailResponseDTO>('/vehicle-specific-details', detail);
  }

  update(id: string, detail: any) {
    return this.api.update<VehicleSpecificDetailResponseDTO>('/vehicle-specific-details', id, detail);
  }

  delete(id: string) {
    return this.api.remove('/vehicle-specific-details', id);
  }
}
