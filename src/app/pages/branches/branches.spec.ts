import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Branches } from './branches';
import { BranchService } from '../../services/branch.service';
import { ToastService } from '../../core/services/toast.service';
import { CacheService } from '../../services/cache.service';
import { BranchResponseDTO, PagedResponse } from '../../shared/interfaces';

// Mock global do SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
  },
}));

// ─── Mocks ─────────────────────────────────────────

const mockAddress = {
  street: 'Other Street',
  number: 456,
  complement: 'Apt 1A',
  district: 'Downtown',
  city: 'Paraná',
  state: 'PR',
  cep: '12345-678',
  country: 'Brazil',
};

const mockBranches: BranchResponseDTO[] = [
  {
    id: 'branch-001',
    name: 'Main Branch',
    email: 'mainbranch@example.com',
    phoneNumber: '(11) 91212-1212',
    managerName: 'John Doe',
    openingHours: '8:00 AM - 6:00 PM',
    branchType: 'Dealership',
    status: 'Active',
    address: mockAddress,
  },
  {
    id: 'branch-002',
    name: 'South Branch',
    email: 'south@example.com',
    phoneNumber: '(21) 91212-0000',
    managerName: 'Jane Smith',
    openingHours: '9:00 AM - 5:00 PM',
    branchType: 'Service Center',
    status: 'Active',
    address: { ...mockAddress, city: 'Rio de Janeiro', state: 'RJ' },
  },
];

const mockPagedResponse = (items: BranchResponseDTO[]): PagedResponse<BranchResponseDTO> =>
  ({
    _embedded: { branchResponseDTOList: items },
    page: { totalElements: items.length, totalPages: 1, size: 12, number: 0 },
  } as unknown as PagedResponse<BranchResponseDTO>);

function createBranchServiceMock() {
  return {
    getAll: vi.fn().mockReturnValue(of(mockPagedResponse(mockBranches))),
    create: vi.fn().mockReturnValue(of({})),
    update: vi.fn().mockReturnValue(of({})),
    delete: vi.fn().mockReturnValue(of({})),
  };
}

function createToastMock() {
  return {
    success: vi.fn(),
    error: vi.fn(),
  };
}

function createCacheMock() {
  const store = new Map<string, unknown>();
  return {
    has: vi.fn((key: string) => store.has(key)),
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: unknown) => store.set(key, value)),
    invalidate: vi.fn((key: string) => store.delete(key)),
  };
}

// ─── Suite ─────────────────────────────────────────

describe('Branches Component', () => {
  let fixture: ComponentFixture<Branches>;
  let component: Branches;
  let branchSvc: ReturnType<typeof createBranchServiceMock>;
  let toastSvc: ReturnType<typeof createToastMock>;
  let cacheSvc: ReturnType<typeof createCacheMock>;

  beforeEach(async () => {
    branchSvc = createBranchServiceMock();
    toastSvc = createToastMock();
    cacheSvc = createCacheMock();

    await TestBed.configureTestingModule({
      imports: [Branches, CommonModule, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: BranchService, useValue: branchSvc },
        { provide: ToastService, useValue: toastSvc },
        { provide: CacheService, useValue: cacheSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Branches);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve chamar load() no ngOnInit', () => {
    const spy = vi.spyOn(component as any, 'load');
    component.ngOnInit();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('deve carregar filiais ao inicializar', async () => {
    cacheSvc.has.mockReturnValue(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(branchSvc.getAll).toHaveBeenCalledWith(0);
    expect(component.items).toHaveLength(2);
    expect(component.totalElements).toBe(2);
  });

  it('não deve salvar com formulário inválido', () => {
    component.save();
    expect(branchSvc.create).not.toHaveBeenCalled();
    expect(branchSvc.update).not.toHaveBeenCalled();
  });

  it('deve chamar create() quando editId está vazio', async () => {
    cacheSvc.has.mockReturnValue(false);

    component.form.patchValue({
      name: 'Filial Norte',
      email: 'norte@example.com',
      managerName: 'Ana Lima',
      openingHours: 'Seg-Sex 8h-18h',
      branchType: 'Concessionária',
      street: 'Av. Paulista',
      number: 1000,
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
    });

    component.save();
    await fixture.whenStable();

    expect(branchSvc.create).toHaveBeenCalledOnce();
  });

  it('deve chamar update() quando editId está preenchido', async () => {
    cacheSvc.has.mockReturnValue(false);

    component.form.patchValue({
      name: 'Filial Norte',
      email: 'norte@example.com',
      managerName: 'Ana Lima',
      openingHours: 'Seg-Sex 8h-18h',
      branchType: 'Concessionária',
      street: 'Av. Paulista',
      number: 1000,
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      country: 'Brasil',
    });

    component.editId = 'branch-001';
    component.save();
    await fixture.whenStable();

    expect(branchSvc.update).toHaveBeenCalledWith('branch-001', expect.any(Object));
  });
});