import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleImageUpload } from './vehicle-image-upload';
import { ApiService } from '../../../services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('VehicleImageUpload', () => {
  let component: VehicleImageUpload;
  let fixture: ComponentFixture<VehicleImageUpload>;

  const apiMock = {
    uploadVehicleImage: vi.fn()
  };

  const toastMock = {
    success: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [VehicleImageUpload],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: ToastService, useValue: toastMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleImageUpload);
    component = fixture.componentInstance;

    // Define input obrigatório
    fixture.componentRef.setInput('vehicleId', '123');

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve adicionar arquivos ao selecionar', () => {
    const file = new File(['test'], 'foto.jpg', { type: 'image/jpeg' });

    component['addFiles']([file]);

    expect(component.previews().length).toBe(1);
    expect(component.selectedFiles.length).toBe(1);
  });

  it('deve remover arquivo corretamente', () => {
    const file = new File(['test'], 'foto.jpg', { type: 'image/jpeg' });

    component['addFiles']([file]);
    component.removeFile(0);

    expect(component.previews().length).toBe(0);
  });

  it('deve ativar drag corretamente', () => {
    const event = {
      preventDefault: vi.fn()
    } as any;

    component.onDragOver(event);

    expect(component.isDragging()).toBe(true);
  });

  it('deve processar drop corretamente', () => {
    const file = new File(['test'], 'drop.jpg', { type: 'image/jpeg' });

    const event = {
      preventDefault: vi.fn(),
      dataTransfer: {
        files: [file]
      }
    } as any;

    component.onDrop(event);

    expect(component.previews().length).toBe(1);
  });

  it('deve formatar tamanho corretamente', () => {
    expect(component.fmtSize(0)).toBe('—');
    expect(component.fmtSize(500)).toBe('500 B');
    expect(component.fmtSize(2048)).toContain('KB');
    expect(component.fmtSize(2 * 1024 * 1024)).toContain('MB');
  });

  it('deve fazer upload e emitir evento', async () => {
    const file = new File(['test'], 'upload.jpg', { type: 'image/jpeg' });

    component['addFiles']([file]);

    apiMock.uploadVehicleImage.mockReturnValue(
      of({
        fileName: 'upload.jpg',
        fileDownloadUri: 'http://fake-url',
        fileType: 'image/jpeg',
        size: 1000
      })
    );

    const emitSpy = vi.spyOn(component.uploaded, 'emit');

    await component.upload();

    // Aguarda possível setTimeout interno
    await new Promise(resolve => setTimeout(resolve, 400));

    expect(component.uploading()).toBe(false);
    expect(component.previews().length).toBe(0);
    expect(component.uploadedFiles().length).toBe(1);
    expect(emitSpy).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('não deve fazer upload se não houver arquivos', async () => {
    await component.upload();
    expect(apiMock.uploadVehicleImage).not.toHaveBeenCalled();
  });

  it('não deve fazer upload sem vehicleId', async () => {
    fixture.componentRef.setInput('vehicleId', null as any);

    const file = new File(['test'], 'foto.jpg');
    component['addFiles']([file]);

    await component.upload();

    expect(apiMock.uploadVehicleImage).not.toHaveBeenCalled();
  });
});