import { Injectable } from '@angular/core';
import { InventoryItem } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<InventoryItem>('/inventory-items', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<InventoryItem>('/inventory-items', id);
  }

  create(i: InventoryItem) {
    return this.api.create<InventoryItem>('/inventory-items', i);
  }

  update(id: string, i: Partial<InventoryItem>) {
    return this.api.update<InventoryItem>('/inventory-items', id, i);
  }

  delete(id: string) {
    return this.api.remove('/inventory-items', id);
  }
}
