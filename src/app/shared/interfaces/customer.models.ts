import { Links } from './common.models';

export type ClientType = 'INDIVIDUAL' | 'CORPORATE' | 'OTHERS';

export interface CustomerRequest {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  registrationDate?: string;
  clientType: ClientType;
  validCnh: boolean;
}

export interface CustomerPatchRequest {
  name?: string;
  phone?: string;
  email?: string;
  clientType?: ClientType;
  validCnh?: boolean;
}

export interface Customer extends CustomerRequest {
  id?: string;
}

export interface CustomerResponseDTO extends Customer {
  _links?: Links;
}

export interface CustomerAddressRequest {
  street: string;
  number: number;
  district: string;
  city: string;
  state: string;
  country: string;
  cep?: string;
  complement?: string;
}

export interface CustomerAddressPatchRequest {
  street?: string;
  number?: number;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  cep?: string;
  complement?: string;
}

export interface CustomerAddress extends CustomerAddressRequest {
  id?: string;
}

export interface CustomerAddressResponseDTO extends CustomerAddress {
  _links?: Links;
}
