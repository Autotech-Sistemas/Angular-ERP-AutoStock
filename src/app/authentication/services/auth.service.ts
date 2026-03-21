import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { LoginRequest, LoginResponse, CurrentUser } from '../../shared/interfaces/models.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private readonly TOKEN = 'as_token';
  private readonly USER = 'as_user';

  currentUser = signal<CurrentUser | null>(this.loadUser());
  isLoggedIn = signal<boolean>(!!this.loadToken());

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.api.create<LoginResponse>('/auth/login', req).pipe(
      tap((res) => {
        const token = res?.token?.accessToken;
        if (!token) throw new Error('Token não recebido');

        const user: CurrentUser = {
          email: req.email ?? '',
          name: res?.token?.username ?? req.email ?? '',
        };

        localStorage.setItem(this.TOKEN, token);
        localStorage.setItem(this.USER, JSON.stringify(user));
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN);
    localStorage.removeItem(this.USER);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.loadToken();
  }

  private loadToken(): string | null {
    return localStorage.getItem(this.TOKEN);
  }

  private loadUser(): CurrentUser | null {
    try {
      return JSON.parse(localStorage.getItem(this.USER) ?? 'null');
    } catch {
      return null;
    }
  }
}