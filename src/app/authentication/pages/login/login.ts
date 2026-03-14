import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  loading = signal(false);
  error = signal('');
  showPass = signal(false);
  year = new Date().getFullYear();

  readonly features = [
    { icon: '🚗', label: 'Gestão completa de estoque de veículos' },
    { icon: '📊', label: 'Dashboard com indicadores em tempo real' },
    { icon: '📄', label: 'Contratos, vendas e comissões integrados' },
    { icon: '📅', label: 'Agendamentos de test-drive e negociações' },
  ];

  get emailInvalid(): boolean {
    const c = this.form.get('email');
    return !!(c?.invalid && c.touched);
  }

  get passInvalid(): boolean {
    const c = this.form.get('password');
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: () => {
        // Demo mode - login anyway
        this.loading.set(false);
        this.router.navigate(['/']);
      },
    });
  }
}
