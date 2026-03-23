import { Links } from './common.models';
import { VehicleResponseDTO } from './vehicle.models';

export interface InventoryItemRequest {
  stockEntryDate?: string;
  acquisitionPrice?: number;
  profitMargin?: number;
  supplier?: string;
  licensePlate?: string;
  chassis?: string;
  vehicleId: string;
}

export interface InventoryItemPatchRequest {
  acquisitionPrice?: number;
  profitMargin?: number;
  supplier?: string;
  licensePlate?: string;
}

export interface InventoryItem {
  id?: string;
  stockEntryDate?: string;
  stockExitDate?: string;
  acquisitionPrice?: number;
  profitMargin?: number;
  supplier?: string;
  licensePlate?: string;
  chassis?: string;
  vehicleId?: string;
}

export interface InventoryItemResponseDTO extends Omit<InventoryItem, 'vehicleId'> {
  vehicle?: VehicleResponseDTO;
  _links?: Links;
}
