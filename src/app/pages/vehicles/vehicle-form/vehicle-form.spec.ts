import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VehicleForm } from './vehicle-form';
import { VehicleService } from '../../../services/vehicle.service';
import { BranchService } from '../../../services/branch.service';
import { ToastService } from '../../../core/services/toast.service';

describe('VehicleForm (Formulário de Veículo)', () => {
  let component: VehicleForm;
  let fixture: ComponentFixture<VehicleForm>;

  const vehicleServiceMock = {
    create: vi.fn(),
    update: vi.fn(),
  };

  const branchServiceMock = {
    getAll: vi.fn(),
  };

  const toastMock = {
    success: vi.fn(),
    error: vi.fn(),
  };

  const branchMockResponse = {
    _embedded: {
      branchResponseDTOList: [
        { id: '1', name: 'Matriz' },
        { id: '2', name: 'Filial 2' },
      ],
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    branchServiceMock.getAll.mockReturnValue(of(branchMockResponse));

    await TestBed.configureTestingModule({
      imports: [VehicleForm],
      providers: [
        { provide: VehicleService, useValue: vehicleServiceMock },
        { provide: BranchService, useValue: branchServiceMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente corretamente', () => {
    expect(component).toBeTruthy();
  });

  it('deve carregar as filiais no ngOnInit', () => {
    expect(branchServiceMock.getAll).toHaveBeenCalled();
    expect(component.branches.length).toBe(2);
  });

  it('deve resetar o formulário ao abrir para novo veículo', () => {
    component.vehicle = null;
    component.isOpen = true;

    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.modalStep).toBe(1);
    expect(component.form.value.type).toBe('CAR');
  });

  it('deve preencher o formulário ao editar veículo', () => {
    component.vehicle = {
      id: '123',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: '2024-01-01',
      branch: { id: '1', name: 'Matriz' },
    } as any;

    component.isOpen = true;

    component.ngOnChanges({
      isOpen: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    expect(component.modalStep).toBe(2);
    expect(component.form.value.brand).toBe('Toyota');
    expect(component.form.value.branchId).toBe('1');
  });

  it('deve avançar para o próximo passo', () => {
    component.modalStep = 1;
    component.nextStep();
    expect(component.modalStep).toBe(2);
  });

  it('deve voltar para o passo anterior', () => {
    component.modalStep = 3;
    component.prevStep();
    expect(component.modalStep).toBe(2);
  });

  it('deve selecionar tipo e avançar etapa', () => {
    component.modalStep = 1;
    component.selectType('TRUCK');

    expect(component.form.value.type).toBe('TRUCK');
    expect(component.modalStep).toBe(2);
  });

  it('deve impedir salvamento se formulário estiver inválido', () => {
    component.form.patchValue({ brand: '' });

    component.save();

    expect(toastMock.error).toHaveBeenCalled();
    expect(vehicleServiceMock.create).not.toHaveBeenCalled();
  });

  it('deve chamar create ao salvar novo veículo', () => {
    component.vehicle = null;

    component.form.patchValue({
      branchId: '1',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2024,
      color: 'White',
      mileage: 0,
      weight: 1000,
      fuelType: 'GASOLINE',
      numberOfCylinders: 4,
      enginePower: 150,
      fuelTankCapacity: 50,
      passengerCapacity: 5,
      salePrice: 100000,
      infotainmentSystem: 'Android Auto',
      description: 'Nice car',
    });

    vehicleServiceMock.create.mockReturnValue(of({}));

    const emitSpy = vi.spyOn(component.saved, 'emit');

    component.save();

    expect(vehicleServiceMock.create).toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('deve chamar update ao editar veículo', () => {
    component.vehicle = { id: '123' } as any;

    component.form.patchValue({
      branchId: '1',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2024,
      color: 'White',
      mileage: 0,
      weight: 1000,
      fuelType: 'GASOLINE',
      numberOfCylinders: 4,
      enginePower: 150,
      fuelTankCapacity: 50,
      passengerCapacity: 5,
      salePrice: 100000,
      infotainmentSystem: 'Android Auto',
      description: 'Nice car',
    });

    vehicleServiceMock.update.mockReturnValue(of({}));

    component.save();

    expect(vehicleServiceMock.update).toHaveBeenCalledWith(
      '123',
      expect.objectContaining({
        manufactureYear: '2024-01-01',
      })
    );
  });

  it('deve tratar erro ao salvar', () => {
    component.vehicle = null;

    component.form.patchValue({
      branchId: '1',
      brand: 'Toyota',
      model: 'Corolla',
      manufactureYear: 2024,
      color: 'White',
      mileage: 0,
      weight: 1000,
      fuelType: 'GASOLINE',
      numberOfCylinders: 4,
      enginePower: 150,
      fuelTankCapacity: 50,
      passengerCapacity: 5,
      salePrice: 100000,
      infotainmentSystem: 'Android Auto',
      description: 'Nice car',
    });

    vehicleServiceMock.create.mockReturnValue(
      throwError(() => ({ message: 'Erro API' }))
    );

    component.save();

    expect(toastMock.error).toHaveBeenCalledWith('Erro API');
  });

  it('deve emitir evento de fechamento', () => {
    const emitSpy = vi.spyOn(component.closed, 'emit');
    component.close();
    expect(emitSpy).toHaveBeenCalled();
  });
});