import { Component, inject, signal, input, output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { ApiService } from '../../../services/api.service';

interface UploadedFile {
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-vehicle-image-upload',
  imports: [CommonModule],
  templateUrl: './vehicle-image-upload.html',
  styleUrl: './vehicle-image-upload.css',
})
export class VehicleImageUpload implements OnDestroy {
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  vehicleId = input.required<string>();
  uploaded  = output<UploadedFile[]>();

  previews      = signal<PreviewFile[]>([]);
  uploadedFiles = signal<UploadedFile[]>([]);
  uploading     = signal(false);
  progress      = signal(0);
  isDragging    = signal(false);

  private objectUrls: string[] = [];

  ngOnDestroy(): void {
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileSelect(e: Event): void {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.addFiles(files);
    (e.target as HTMLInputElement).value = '';
  }

  private addFiles(files: File[]): void {
    const newPreviews = files.map(file => {
      const previewUrl = URL.createObjectURL(file);
      this.objectUrls.push(previewUrl);
      return { file, previewUrl };
    });
    this.previews.update(prev => [...prev, ...newPreviews]);
  }

  removeFile(index: number): void {
    const current = this.previews();
    URL.revokeObjectURL(current[index].previewUrl);
    this.previews.update(prev => prev.filter((_, i) => i !== index));
  }

  get selectedFiles(): File[] {
    return this.previews().map(p => p.file);
  }

  async upload(): Promise<void> {
    const previews   = this.previews();
    const vehicleId  = this.vehicleId();

    if (!previews.length || !vehicleId) return;

    this.uploading.set(true);
    this.progress.set(0);

    const results: UploadedFile[] = [];

    for (let i = 0; i < previews.length; i++) {
      try {
        const res = (await this.api
          .uploadVehicleImage(vehicleId, previews[i].file)
          .toPromise()) as UploadedFile;
        if (res) results.push(res);
      } catch {
        /* continue */
      }
      this.progress.set(Math.round(((i + 1) / previews.length) * 100));
    }

    setTimeout(() => {
      previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
      this.objectUrls = this.objectUrls.filter(
        url => !previews.map(p => p.previewUrl).includes(url)
      );

      this.uploading.set(false);
      this.progress.set(0);
      this.previews.set([]);
      this.uploadedFiles.update(prev => [...results, ...prev]);
      this.uploaded.emit(results);
      this.toast.success(`${results.length} imagem(ns) enviada(s)!`);
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