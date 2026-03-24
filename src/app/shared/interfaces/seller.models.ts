import { Links } from './common.models';

export interface SellerRegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  hireDate?: string;
  salary?: number;
  commissionRate?: number;
  status?: string;
}

export interface SellerPatchRequest {
  name?: string;
  phone?: string;
  salary?: number;
  commissionRate?: number;
  status?: string;
}

export interface Seller {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  hireDate?: string;
  salary?: number;
  commissionRate?: number;
  status?: string;
  enabled?: boolean;
  role?: string;
}

export interface SellerResponseDTO {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  salary?: number;
  commissionRate?: number;
  status?: string;
  enabled?: boolean;
  role?: string;
  _links?: Links;
}
