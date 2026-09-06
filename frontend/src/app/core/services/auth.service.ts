import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginResponse } from '../models/medical.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'sys_citas_token';
  private readonly USER_KEY = 'sys_citas_user';

  readonly currentUser = signal<AuthUser | null>(this.getStoredUser());
  readonly token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));
  
  readonly isLoggedIn = computed(() => !!this.token());
  readonly userRole = computed(() => this.currentUser()?.id_rol ?? null);
  readonly userRoleName = computed(() => this.currentUser()?.rol_nombre ?? '');

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): AuthUser | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  login(nombre_usuario: string, contrasenia: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { nombre_usuario, contrasenia }).pipe(
      tap(res => {
        if (res.success && res.token && res.user) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
          this.token.set(res.token);
          this.currentUser.set(res.user);
          this.redirectAfterLogin(res.user.id_rol);
        }
      })
    );
  }

  register(data: {
    nombre_usuario: string;
    contrasenia: string;
    nombre_cli: string;
    apellido_cli: string;
    nacimiento_cli: string;
    telefono_cli?: string;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  getDemoUsers(): Observable<any> {
    return this.http.get(`${this.API_URL}/demo-users`);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  redirectAfterLogin(roleId: number): void {
    if (roleId === 1) {
      this.router.navigate(['/paciente']);
    } else if (roleId === 2) {
      this.router.navigate(['/medico']);
    } else if (roleId === 3) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
