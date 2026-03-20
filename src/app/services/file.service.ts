import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private api: ApiService) {}

  uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.create<any>('/file/upload-file', formData);
  }

  uploadMultipleFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return this.api.create<any>('/file/upload-multiple-files', formData);
  }

  downloadFile(fileName: string) {
    return this.api.getAll<Blob>(`/file/download-file/${fileName}`);
  }
}
