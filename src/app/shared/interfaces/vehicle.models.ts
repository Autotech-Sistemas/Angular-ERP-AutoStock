import { Links } from './common.models';
import { BranchResponseDTO } from './branch.models';

export type VehicleType = 'CAR' | 'MOTORCYCLE' | 'VAN' | 'BUS' | 'TRUCK' | 'BOAT' | 'OTHER_VEHICLE_TYPE';
export type VehicleCategory = 'SUV' | 'SEDAN' | 'HATCHBACK' | 'SPORTS' | 'UTILITARIAN' | 'COUPE' | 'CONVERTIBLE' | 'WAGON' | 'PICKUP' | 'VAN' | 'MOTORHOME' | 'ELECTRIC' | 'HYBRID' | 'OTHERS';
export type FuelType = 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'ETHANOL' | 'LPG' | 'CNG' | 'PROPANE' | 'OTHERS';
export type TransmissionType = 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC' | 'CVT' | 'DUAL_CLUTCH' | 'OTHERS';
export type VehicleStatus = 'NEW' | 'USED' | 'SEMINOVO' | 'OTHERS';
export type VehicleAvailability = 'AVAILABLE' | 'SOLD' | 'PENDING' | 'RESERVED' | 'IN_NEGOTIATION' | 'OTHERS';

export interface VehicleImageFile {
  id?: string;
  name?: string;
  downloadUri?: string;       // campo retornado pelo GET /vehicles
  fileDownloadUri?: string;   // campo retornado pelo POST /file/upload-vehicle-image
  type?: string;
  fileType?: string;
  size?: number;
}

export interface UploadFileResponseDTO {
  fileName?: string;
  fileDownloadUri?: string;
  fileType?: string;
  size?: number;
}

export interface VehicleSpecificDetail {
  id?: string;
  detail: string;
}

export interface VehicleSpecificDetailResponseDTO extends VehicleSpecificDetail {
  _links?: Links;
}

export interface VehicleRequest {
  brand: string;
  model: string;
  modelYear?: string;
  type: VehicleType;
  category: VehicleCategory;
  manufactureYear: string;
  color: string;
  mileage: number;
  weight: number;
  fuelType: FuelType;
  transmissionType?: TransmissionType;
  numberOfCylinders: number;
  infotainmentSystem?: string;
  fuelTankCapacity: number;
  enginePower: number;
  passengerCapacity: number;
  salePrice: number;
  status?: VehicleStatus;
  availability?: VehicleAvailability;
  description?: string;
  branchId: string;
  brakeType?: string;
  groundClearance?: number;
  autonomyRoad?: number;
  autonomyCity?: number;
  numberOfGears?: number;
  steeringType?: string;
  tireSize?: number;
  doors?: number;
  trunkCapacity?: number;
  driveType?: string;
  hasLuggageCarrier?: boolean;
  isCargo?: boolean;
  cargoVolume?: number;
  loadCapacity?: number;
  axles?: number;
  numberOfSeats?: number;
  hasAccessibility?: boolean;
  length?: number;
  hullMaterial?: string;
  autonomy?: number;
  usage?: string;
}

export interface VehiclePatchRequest {
  color?: string;
  salePrice?: number;
  availability?: VehicleAvailability;
  status?: VehicleStatus;
  description?: string;
  mileage?: number;
  branchId?: string;
}

export interface Vehicle extends VehicleRequest {
  id?: string;
  lastUpdate?: string;
  branch?: BranchResponseDTO;
  specificDetails?: VehicleSpecificDetail[];
  images?: VehicleImageFile[];
}

export interface VehicleResponseDTO extends Vehicle {
  _links?: Links;
}
