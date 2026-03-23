import { Links } from './common.models';

export interface LoginRequest {
  email?: string;
  password?: string;
}

export interface LoginResponse {
  token?: TokenDTO;
  _links?: Links;
}

export interface TokenDTO {
  username?: string;
  created?: string;
  expiration?: string;
  accessToken?: string;
  _links?: Links;
}

export interface CurrentUser {
  email: string;
  name: string;
  role?: string;
}
