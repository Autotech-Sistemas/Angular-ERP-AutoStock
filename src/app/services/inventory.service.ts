import { Injectable } from '@angular/core';
import { InventoryItem, InventoryItemResponseDTO } from '../shared/interfaces/models.interface';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  constructor(private api: ApiService) {}

  getAll(page = 0, size = 12, direction = 'asc') {
    return this.api.getAll<InventoryItemResponseDTO>('/inventory-items', page, size, direction);
  }

  getById(id: string) {
    return this.api.getById<InventoryItemResponseDTO>('/inventory-items', id);
  }

  create(i: InventoryItem) {
    return this.api.create<InventoryItemResponseDTO>('/inventory-items', i);
  }

  update(id: string, i: Partial<InventoryItem>) {
    return this.api.update<InventoryItemResponseDTO>('/inventory-items', id, i);
  }

  delete(id: string) {
    return this.api.remove('/inventory-items', id);
  }
}
