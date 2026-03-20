import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class VehicleSpecificDetailService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
	return this.api.getAll<any>('/vehicle-specific-details', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<any>('/vehicle-specific-details', id);
  }

  create(detail: any) {
    return this.api.create<any>('/vehicle-specific-details', detail);
  }

  update(id: string, detail: any) {
    return this.api.update<any>('/vehicle-specific-details', id, detail);
  }

  delete(id: string) {
    return this.api.remove('/vehicle-specific-details', id);
  }
}
