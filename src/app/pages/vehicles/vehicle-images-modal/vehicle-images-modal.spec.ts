import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VehicleImagesModal } from './vehicle-images-modal';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('VehicleImagesModal', () => {
  let component: VehicleImagesModal;
  let fixture: ComponentFixture<VehicleImagesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleImagesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleImagesModal);
    component = fixture.componentInstance;
  });

  it('deve criar o componente', () => {
    component.isOpen = true;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('deve resolver downloadUri corretamente', () => {
    const img = { downloadUri: 'url-get' } as any;
    expect(component.getImageUrl(img)).toBe('url-get');
  });

  it('deve resolver fileDownloadUri corretamente', () => {
    const img = { fileDownloadUri: 'url-post' } as any;
    expect(component.getImageUrl(img)).toBe('url-post');
  });

  it('deve retornar string vazia se não houver url', () => {
    const img = {} as any;
    expect(component.getImageUrl(img)).toBe('');
  });

  it('deve emitir evento ao fechar', () => {
    const spy = vi.spyOn(component.closed, 'emit');
    component.close();
    expect(spy).toHaveBeenCalled();
  });

  it('deve emitir imagesUpdated quando houver vehicle', () => {
    const spy = vi.spyOn(component.imagesUpdated, 'emit');

    component.vehicle = {
      id: '1',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'Preto',
      images: [],
    } as any;

    component.onUploaded([
      {
        fileName: 'foto.jpg',
        fileDownloadUri: 'url',
        fileType: 'image/jpeg',
        size: 100,
      },
    ]);

    expect(spy).toHaveBeenCalled();
  });

  it('não deve emitir imagesUpdated se vehicle for null', () => {
    const spy = vi.spyOn(component.imagesUpdated, 'emit');

    component.vehicle = null;

    component.onUploaded([
      {
        fileName: 'foto.jpg',
        fileDownloadUri: 'url',
        fileType: 'image/jpeg',
        size: 100,
      },
    ]);

    expect(spy).not.toHaveBeenCalled();
  });

  it('deve renderizar mensagem quando não houver imagens', () => {
    component.isOpen = true;

    component.vehicle = {
      id: '1',
      brand: 'Honda',
      model: 'Civic',
      color: 'Branco',
      images: [],
    } as any;

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent?.toLowerCase()).toContain('nenhuma imagem');
  });

  it('deve renderizar galeria quando houver imagens', () => {
    component.isOpen = true;

    component.vehicle = {
      id: '1',
      brand: 'Honda',
      model: 'Civic',
      color: 'Branco',
      images: [{ id: 1, downloadUri: 'url1' }],
    } as any;

    fixture.detectChanges();

    const images = fixture.nativeElement.querySelectorAll('img');

    expect(images.length).toBeGreaterThan(0);
  });
});
