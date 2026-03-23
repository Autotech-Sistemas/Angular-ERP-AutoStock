import { Links, PageMetadata } from './common.models';
import { CustomerResponseDTO } from './customer.models';
import { SellerResponseDTO } from './seller.models';
import { InventoryItemResponseDTO } from './inventory.models';

export type AppointmentType = 'TEST_DRIVE' | 'NEGOTIATION_VISIT';
export type AppointmentStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface AppointmentRequest {
  date: string;
  appointmentType: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  customerId: string;
  sellerId: string;
}

export interface AppointmentPatchRequest {
  date?: string;
  appointmentType?: AppointmentType;
  appointmentStatus?: AppointmentStatus;
}

export interface AppointmentResponseDTO {
  id?: string;
  date?: string;
  appointmentType?: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  customer?: CustomerResponseDTO;
  seller?: SellerResponseDTO;
  inventoryItemCommitments?: InventoryItemResponseDTO[];
  _links?: Links;
}

export interface AppointmentResponse {
  _embedded?: {
    appointmentResponseDTOList: AppointmentResponseDTO[];
  };
  _links?: Links;
  page?: PageMetadata;
}
