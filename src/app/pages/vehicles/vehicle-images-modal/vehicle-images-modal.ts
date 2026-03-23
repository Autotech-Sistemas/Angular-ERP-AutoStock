import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { Modal } from '../../../shared/components/modal/modal';
import { VehicleImageUpload } from '../vehicle-image-upload/vehicle-image-upload';
import { VehicleResponseDTO, VehicleImageFile } from '../../../shared/interfaces';

interface UploadedFile {
  fileName: string;
  fileDownloadUri: string;
  fileType: string;
  size: number;
}

@Component({
  selector: 'app-vehicle-images-modal',
  imports: [CommonModule, Modal, VehicleImageUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vehicle-images-modal.html',
  styleUrl: './vehicle-images-modal.css',
})
export class VehicleImagesModal {
  private cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Input() vehicle: VehicleResponseDTO | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() imagesUpdated = new EventEmitter<UploadedFile[]>();

  // Resolve downloadUri (GET) ou fileDownloadUri (POST upload)
  getImageUrl = (img: VehicleImageFile): string =>
    img.downloadUri ?? img.fileDownloadUri ?? '';

  onUploaded(files: UploadedFile[]): void {
    if (!this.vehicle) return;
    this.imagesUpdated.emit(files);
    this.cdr.markForCheck();
  }

  close(): void {
    this.closed.emit();
  }
}