import { Links } from './common.models';

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

export interface BranchAddressRequest {
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
  complement?: string;
}

export interface BranchAddressPatchRequest {
  street?: string;
  number?: number;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  cep?: string;
  complement?: string;
}

export interface BranchAddressResponseDTO extends BranchAddress {
  _links?: Links;
}

export interface BranchRequest {
  name: string;
  phoneNumber?: string;
  email: string;
  managerName: string;
  openingHours: string;
  branchType: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  branchAddressId: string;
}

export interface BranchPatchRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  managerName?: string;
  openingHours?: string;
  branchType?: string;
  status?: string;
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
  address?: BranchAddressResponseDTO;
}

export interface BranchResponseDTO extends Branch {
  _links?: Links;
}
