import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, CurrentUser } from '../../shared/interfaces/models.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API   = 'http://localhost:8889/api';
  private readonly TOKEN = 'as_token';
  private readonly USER  = 'as_user';

  currentUser = signal<CurrentUser | null>(this.loadUser());
  isLoggedIn  = signal<boolean>(!!this.loadToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, req).pipe(
      tap(res => {
        const token = res?.token?.accessToken ?? 'demo';
        const user: CurrentUser = { email: req.email, name: 'Administrador' };
        localStorage.setItem(this.TOKEN, token);
        localStorage.setItem(this.USER, JSON.stringify(user));
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      }),
      catchError(err => {
        // Demo mode — allow any login
        const token = 'demo-token';
        const user: CurrentUser = { email: req.email, name: 'Administrador' };
        localStorage.setItem(this.TOKEN, token);
        localStorage.setItem(this.USER, JSON.stringify(user));
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
        return throwError(() => err);
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

  getToken(): string | null { return this.loadToken(); }

  private loadToken(): string | null { return localStorage.getItem(this.TOKEN); }
  private loadUser(): CurrentUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER) ?? 'null'); }
    catch { return null; }
  }
}
