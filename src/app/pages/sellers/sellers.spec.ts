import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sellers } from './sellers';

describe('Sellers', () => {
  let component: Sellers;
  let fixture: ComponentFixture<Sellers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sellers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sellers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
