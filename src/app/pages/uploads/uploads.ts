import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface UploadedFile {
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

@Component({
  selector: 'app-uploads',
  imports: [CommonModule],
  templateUrl: './uploads.html',
  styleUrl: './uploads.css',
})
export class Uploads {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly apiBase = 'http://localhost:8889/api';

  selectedFiles = signal<File[]>([]);
  uploadedFiles = signal<UploadedFile[]>([]);
  uploading = signal(false);
  progress = signal(0);
  isDragging = signal(false);

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.selectedFiles.update((prev) => [...prev, ...files]);
  }

  onFileSelect(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.selectedFiles.update((prev) => [...prev, ...files]);
  }

  removeFile(index: number): void {
    this.selectedFiles.update((prev) => prev.filter((_, i) => i !== index));
  }

  async upload(): Promise<void> {
    const files = this.selectedFiles();
    if (!files.length) return;
    this.uploading.set(true);
    this.progress.set(0);
    const results: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const res = (await this.api.uploadFile(files[i]).toPromise()) as UploadedFile;
        if (res) results.push(res);
      } catch {
        /* continue */
      }
      this.progress.set(Math.round(((i + 1) / files.length) * 100));
    }

    setTimeout(() => {
      this.uploading.set(false);
      this.progress.set(0);
      this.selectedFiles.set([]);
      this.uploadedFiles.update((prev) => [...results, ...prev]);
      this.toast.success(`${results.length} arquivo(s) enviado(s)!`);
    }, 400);
  }

  getExt(name: string): string {
    return (name.split('.').pop() ?? 'FILE').toUpperCase().substring(0, 4);
  }

  fmtSize(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
