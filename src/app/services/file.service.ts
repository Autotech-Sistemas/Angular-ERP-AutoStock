import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private api: ApiService) {}

  uploadVehicleImage(vehicleId: string, file: File) {
    return this.api.uploadVehicleImage(vehicleId, file);
  }

  uploadMultipleVehicleImages(vehicleId: string, files: File[]) {
    return this.api.uploadMultipleVehicleImages(vehicleId, files);
  }
}
