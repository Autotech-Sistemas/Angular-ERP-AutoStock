import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private api: ApiService) {}

  getSummary() {
    return this.api.get<any>('/dashboard/summary');
  }
}
