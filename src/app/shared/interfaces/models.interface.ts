// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PageMeta {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface PagedResponse<T> {
  _embedded?: Record<string, T[]>;
  _links?: Record<string, unknown>;
  page?: PageMeta;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse { token: TokenDTO; }
export interface TokenDTO {
  username: string;
  created: string;
  expiration: string;
  accessToken: string;
}
export interface CurrentUser {
  email: string;
  name: string;
  role?: string;
}

// ─── Vehicle ─────────────────────────────────────────────────────────────────
export type VehicleType       = 'CAR'|'MOTORCYCLE'|'VAN'|'BUS'|'TRUCK'|'BOAT'|'OTHER_VEHICLE_TYPE';
export type VehicleCategory   = 'SUV'|'SEDAN'|'HATCHBACK'|'SPORTS'|'UTILITARIAN'|'COUPE'|'CONVERTIBLE'|'WAGON'|'PICKUP'|'VAN'|'MOTORHOME'|'ELECTRIC'|'HYBRID'|'OTHERS';
export type FuelType          = 'GASOLINE'|'DIESEL'|'ELECTRIC'|'HYBRID'|'ETHANOL'|'LPG'|'CNG'|'PROPANE'|'OTHERS';
export type VehicleStatus     = 'NEW'|'USED'|'SEMINOVO'|'OTHERS';
export type VehicleAvailability = 'AVAILABLE'|'SOLD'|'PENDING'|'RESERVED'|'IN_NEGOTIATION'|'OTHERS';

export interface VehicleImageFile {
  id?: string;
  name: string;
  downloadUri: string;
  type: string;
  size: number;
}

export interface VehicleSpecificDetail {
  id?: string;
  detail: string;
}

export interface Vehicle {
  id?: string;
  brand: string;
  model: string;
  type: VehicleType;
  category: VehicleCategory;
  manufactureYear: string;
  color: string;
  mileage: number;
  weight: number;
  fuelType: FuelType;
  numberOfCylinders: number;
  infotainmentSystem: string;
  fuelTankCapacity: number;
  enginePower: number;
  passengerCapacity: number;
  salePrice: number;
  status?: VehicleStatus;
  availability?: VehicleAvailability;
  description: string;
  lastUpdate?: string;
  specificDetails?: VehicleSpecificDetail[];
  images?: VehicleImageFile[];
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export interface InventoryItem {
  id?: string;
  stockEntryDate?: string;
  stockExitDate?: string;
  acquisitionPrice?: number;
  profitMargin?: number;
  supplier?: string;
  licensePlate?: string;
  chassis?: string;
  vehicle: Partial<Vehicle>;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export type ClientType = 'INDIVIDUAL'|'CORPORATE'|'OTHERS';

export interface Customer {
  id?: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  registrationDate?: string;
  clientType: ClientType;
  validCnh: boolean;
}

export interface CustomerAddress {
  id?: string;
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
  complement?: string;
}

// ─── Seller ──────────────────────────────────────────────────────────────────
export interface SellerRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  hireDate: string;
  salary: number;
  commissionRate: number;
  status?: string;
}

export interface Seller {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

// ─── Sale ────────────────────────────────────────────────────────────────────
export interface Sale {
  id?: string;
  saleDate: string;
  grossAmount: number;
  netAmount?: number;
  appliedDiscount?: number;
  paymentMethod: string;
  installmentsNumber?: number;
  receipt: string;
  seller: Partial<Seller>;
  customer: Partial<Customer>;
  inventoryItem: Partial<InventoryItem>;
  invoice?: string;
}

// ─── Contract ────────────────────────────────────────────────────────────────
export type PaymentTerms     = 'CASH'|'BANK_TRANSFER'|'CREDIT_CARD'|'DEBIT_CARD'|'PIX'|'CHECK'|'INSTALLMENTS_WITHOUT_INTEREST'|'INSTALLMENTS_WITH_INTEREST'|'FINANCED_BY_BANK'|'FINANCED_BY_DEALERSHIP'|'TRADE_IN'|'PARTIAL_CASH_PARTIAL_FINANCING'|'OTHER';
export type ContractStatus   = 'SIGNED'|'CANCELLED'|'EXPIRED'|'PENDING';

export interface Contract {
  id?: string;
  contractNumber: string;
  contractType: string;
  contractDate: string;
  deliveryDate: string;
  totalAmount: number;
  paymentTerms: PaymentTerms;
  contractStatus?: ContractStatus;
  notes?: string;
  attachments: string;
  sale: Partial<Sale>;
}

// ─── Branch ──────────────────────────────────────────────────────────────────
export interface BranchAddress {
  id?: string;
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
  complement?: string;
}

export interface Branch {
  id?: string;
  name: string;
  phoneNumber?: string;
  email: string;
  managerName: string;
  openingHours: string;
  branchType: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  address: BranchAddress;
}

// ─── Appointment ─────────────────────────────────────────────────────────────
export type AppointmentType   = 'TEST_DRIVE'|'NEGOTIATION_VISIT';
export type AppointmentStatus = 'PENDING'|'COMPLETED'|'CANCELLED';

export interface Appointment {
  id?: string;
  date: string;
  appointmentType: AppointmentType;
  appointmentStatus?: AppointmentStatus;
  customer: Partial<Customer>;
  seller: Partial<Seller>;
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface AdminRegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Admin {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────
export interface UploadFileResponse {
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  section: string;
}
