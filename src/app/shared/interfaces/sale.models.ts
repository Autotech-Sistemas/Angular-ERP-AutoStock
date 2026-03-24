import { Links } from './common.models';
import { CustomerResponseDTO } from './customer.models';
import { SellerResponseDTO } from './seller.models';
import { InventoryItemResponseDTO } from './inventory.models';

export interface SaleRequest {
  saleDate: string;
  grossAmount: number;
  netAmount?: number;
  appliedDiscount?: number;
  installmentsNumber?: number;
  paymentMethod: string;
  receipt: string;
  invoice?: string;
  customerId: string;
  sellerId: string;
  inventoryId: string;
}

export interface SalePatchRequest {
  paymentMethod?: string;
  appliedDiscount?: number;
  netAmount?: number;
  installmentsNumber?: number;
  customerId?: string;
  invoice?: string;
}

export interface SaleResponseDTO {
  id?: string;
  saleDate?: string;
  grossAmount?: number;
  netAmount?: number;
  appliedDiscount?: number;
  installmentsNumber?: number;
  paymentMethod?: string;
  receipt?: string;
  invoice?: string;
  seller?: SellerResponseDTO;
  customer?: CustomerResponseDTO;
  inventoryItem?: InventoryItemResponseDTO;
  _links?: Links;
}
