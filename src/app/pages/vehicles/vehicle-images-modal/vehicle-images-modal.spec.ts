import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleImagesModal } from './vehicle-images-modal';

describe('VehicleImagesModal', () => {
  let component: VehicleImagesModal;
  let fixture: ComponentFixture<VehicleImagesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleImagesModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleImagesModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
