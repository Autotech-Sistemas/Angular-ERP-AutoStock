import { Links } from './common.models';

export interface Admin {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  enabled?: boolean;
}

export interface AdminRegisterRequest extends Omit<Admin, 'id'> {
  password?: string;
}

export interface AdminPatchRequest {
  name?: string;
  phone?: string;
}

export interface AdminResponseDTO extends Admin {
  _links?: Links;
}
