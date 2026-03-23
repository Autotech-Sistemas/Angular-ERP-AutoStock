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
import { VehicleResponseDTO, VehicleImageFile } from '../../../shared/interfaces';
import { VehicleImageUpload } from '../vehicle-image-upload/vehicle-image-upload';

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
  @Output() imagesUpdated = new EventEmitter<VehicleImageFile[]>();

  onUploaded(files: VehicleImageFile[]): void {
    if (!this.vehicle) return;
    const current = this.vehicle.images ?? [];
    this.vehicle = { ...this.vehicle, images: [...current, ...files] };
    this.imagesUpdated.emit(this.vehicle.images);
    this.cdr.markForCheck();
  }

  close(): void {
    this.closed.emit();
  }
}
