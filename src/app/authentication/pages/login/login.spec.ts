import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Login Component', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };

    routerMock = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Login, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com view = login', () => {
    expect(component.view).toBe('login');
  });

  it('formulário deve iniciar inválido', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('deve validar email inválido', () => {
    const email = component.form.get('email');
    email?.setValue('email-invalido');
    email?.markAsTouched();

    expect(component.emailInvalid).toBe(true);
  });

  it('deve validar senha com menos de 4 caracteres', () => {
    const pass = component.form.get('password');
    pass?.setValue('123');
    pass?.markAsTouched();

    expect(component.passInvalid).toBe(true);
  });

  it('não deve chamar login se formulário inválido', () => {
    component.onSubmit();
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('deve chamar login e navegar para "/" quando sucesso', () => {
    component.form.setValue({
      email: 'teste@email.com',
      password: '1234',
    });

    authServiceMock.login.mockReturnValue(of({}));

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    expect(component.loading()).toBe(false);
  });

  it('deve tratar erro 401/403', () => {
    component.form.setValue({
      email: 'teste@email.com',
      password: '1234',
    });

    authServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 401 }))
    );

    component.onSubmit();

    expect(component.error()).toBe('E-mail ou senha inválidos.');
  });

  it('deve tratar erro de conexão (status 0)', () => {
    component.form.setValue({
      email: 'teste@email.com',
      password: '1234',
    });

    authServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 0 }))
    );

    component.onSubmit();

    expect(component.error()).toBe(
      'Não foi possível conectar ao servidor.'
    );
  });

  it('deve tratar erro 500+', () => {
    component.form.setValue({
      email: 'teste@email.com',
      password: '1234',
    });

    authServiceMock.login.mockReturnValue(
      throwError(() => ({ status: 500 }))
    );

    component.onSubmit();

    expect(component.error()).toBe(
      'Erro interno no servidor. Tente novamente.'
    );
  });

  it('deve alternar exibição de senha', () => {
    expect(component.showPass()).toBe(false);
    component.showPass.update(v => !v);
    expect(component.showPass()).toBe(true);
  });

  it('deve mudar para view recovery', () => {
    component.view = 'recovery';
    expect(component.view).toBe('recovery');
  });
});