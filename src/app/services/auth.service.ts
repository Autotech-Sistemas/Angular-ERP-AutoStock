import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private api: ApiService) {}
  
  login(credentials: any) {
    return this.api.create<any>('/auth/login', credentials);
  }
}
