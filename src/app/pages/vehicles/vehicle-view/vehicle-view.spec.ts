import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VehicleView } from './vehicle-view';

describe('VehicleView', () => {
  let component: VehicleView;
  let fixture: ComponentFixture<VehicleView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleView],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  function setup(vehicleMock: any) {
    fixture = TestBed.createComponent(VehicleView);
    component = fixture.componentInstance;

    component.isOpen = true;
    component.vehicle = vehicleMock;

    fixture.detectChanges();
  }

  it('deve criar o componente', () => {
    setup({});
    expect(component).toBeTruthy();
  });

  // =========================
  // UTILITÁRIOS
  // =========================

  it('deve formatar moeda corretamente', () => {
    setup({});
    const result = component.fmtCurrency(10000);
    expect(result).toContain('10.000');
    expect(result).toContain('R$');
  });

  it('deve renderizar dados principais do veículo', () => {
    setup({
      brand: 'Toyota',
      model: 'Corolla',
      category: 'Sedan',
      manufactureYear: 2022,
      salePrice: 100000,
      mileage: 20000,
      type: 'CAR',
      images: []
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Toyota');
    expect(compiled.textContent).toContain('Corolla');
    expect(compiled.textContent).toContain('Sedan');
  });

  it('deve renderizar imagem única corretamente', () => {
    setup({
      brand: 'Honda',
      model: 'Civic',
      type: 'CAR',
      salePrice: 1,
      mileage: 1,
      images: [{ downloadUri: 'img1' }]
    });

    const images = fixture.nativeElement.querySelectorAll('img');
    expect(images.length).toBe(1);
  });

  it('deve renderizar grid quando houver múltiplas imagens', () => {
    setup({
      brand: 'Honda',
      model: 'Civic',
      type: 'CAR',
      salePrice: 1,
      mileage: 1,
      images: [
        { downloadUri: 'img1' },
        { downloadUri: 'img2' },
        { downloadUri: 'img3' }
      ]
    });

    const images = fixture.nativeElement.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(1);
  });

  it('deve renderizar detalhes específicos para BOAT', () => {
    setup({
      brand: 'Yamaha',
      model: 'WaveRunner',
      type: 'BOAT',
      salePrice: 1,
      mileage: 1,
      length: 25,
      hullMaterial: 'Fibra',
      autonomy: '300 km',
      images: []
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Comprimento');
    expect(compiled.textContent).toContain('Casco');
  });

  it('deve emitir evento ao fechar', () => {
    setup({});
    const spy = vi.spyOn(component.closed, 'emit');
    component.close();
    expect(spy).toHaveBeenCalled();
  });
});