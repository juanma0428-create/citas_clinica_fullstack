import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
          </div>
          <h2>SysCitas Hospital</h2>
          <p>Sistema de Reservas y Gestión de Consultas Médicas</p>
        </div>

        <!-- Switch Tabs: Iniciar Sesión / Registro Paciente -->
        <div class="auth-tabs">
          <button [class.active]="isLoginMode()" (click)="isLoginMode.set(true)">
            Iniciar Sesión
          </button>
          <button [class.active]="!isLoginMode()" (click)="isLoginMode.set(false)">
            Registrar Paciente
          </button>
        </div>

        <!-- Feedback Alert -->
        @if (errorMessage()) {
          <div class="alert alert-error">
            <span>⚠️</span>
            <p>{{ errorMessage() }}</p>
          </div>
        }
        @if (successMessage()) {
          <div class="alert alert-success">
            <span>✅</span>
            <p>{{ successMessage() }}</p>
          </div>
        }

        <!-- LOGIN FORM -->
        @if (isLoginMode()) {
          <form [formGroup]="loginForm" (ngSubmit)="onLoginSubmit()">
            <div class="form-group">
              <label class="form-label">Nombre de Usuario</label>
              <input 
                type="text" 
                class="form-control" 
                formControlName="nombre_usuario" 
                placeholder="ej. paciente_juan, dr_carlos"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input 
                type="password" 
                class="form-control" 
                formControlName="contrasenia" 
                placeholder="Ingresa tu clave"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="loginForm.invalid || isLoading()">
              @if (isLoading()) {
                <span>Ingresando...</span>
              } @else {
                <span>Acceder al Portal</span>
              }
            </button>
          </form>

          <!-- Quick Demo Accounts (1-Click Fill) -->
          <div class="demo-accounts-box">
            <h4>⚡ Acceso Rápido de Prueba (1 Click):</h4>
            <div class="demo-chips">
              <button type="button" class="demo-chip patient" (click)="fillDemo('paciente_juan', 'clave123')">
                <strong>Paciente</strong>
                <span>Juan Manuel Chica</span>
              </button>
              <button type="button" class="demo-chip doctor" (click)="fillDemo('dr_carlos', 'clave123')">
                <strong>Médico</strong>
                <span>Dr. Carlos (Cardio)</span>
              </button>
              <button type="button" class="demo-chip admin" (click)="fillDemo('admin_roberto', 'clave123')">
                <strong>Admin</strong>
                <span>Roberto Sánchez</span>
              </button>
            </div>
          </div>
        } @else {
          <!-- REGISTER PATIENT FORM -->
          <form [formGroup]="registerForm" (ngSubmit)="onRegisterSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" class="form-control" formControlName="nombre_cli" placeholder="Nombre" />
              </div>
              <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" class="form-control" formControlName="apellido_cli" placeholder="Apellido" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Fecha Nacimiento</label>
                <input type="date" class="form-control" formControlName="nacimiento_cli" />
              </div>
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="text" class="form-control" formControlName="telefono_cli" placeholder="ej. 5555-1234" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Usuario</label>
              <input type="text" class="form-control" formControlName="nombre_usuario" placeholder="Elige un usuario" />
            </div>

            <div class="form-group">
              <label class="form-label">Contraseña</label>
              <input type="password" class="form-control" formControlName="contrasenia" placeholder="Crea tu contraseña" />
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="registerForm.invalid || isLoading()">
              @if (isLoading()) {
                <span>Creando cuenta...</span>
              } @else {
                <span>Registrar Paciente</span>
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top right, #0d9488 0%, #0f172a 70%);
      padding: 1.5rem;
    }

    .auth-card {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.35);
      max-width: 480px;
      width: 100%;
      padding: 2.25rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .brand-badge {
      width: 54px;
      height: 54px;
      margin: 0 auto 0.75rem;
      border-radius: 14px;
      background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(13, 148, 136, 0.35);
    }

    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .auth-header p {
      font-size: 0.85rem;
      color: #64748b;
    }

    .auth-tabs {
      display: flex;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 4px;
      margin-bottom: 1.5rem;
    }

    .auth-tabs button {
      flex: 1;
      padding: 0.55rem;
      border: none;
      background: transparent;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .auth-tabs button.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }

    .alert {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .alert-error {
      background: #ffe4e6;
      color: #be123c;
      border: 1px solid #fecdd3;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .demo-accounts-box {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid #f1f5f9;
    }

    .demo-accounts-box h4 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.75rem;
    }

    .demo-chips {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }

    .demo-chip {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.5rem;
      text-align: left;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .demo-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }

    .demo-chip strong {
      font-size: 0.75rem;
    }

    .demo-chip span {
      font-size: 0.65rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .demo-chip.patient { border-color: #99f6e4; background: #f0fdfa; }
    .demo-chip.patient strong { color: #0d9488; }

    .demo-chip.doctor { border-color: #bae6fd; background: #f0f9ff; }
    .demo-chip.doctor strong { color: #0284c7; }

    .demo-chip.admin { border-color: #fde68a; background: #fffbeb; }
    .demo-chip.admin strong { color: #d97706; }
  `]
})
export class LoginComponent {
  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      nombre_usuario: ['', Validators.required],
      contrasenia: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nombre_cli: ['', Validators.required],
      apellido_cli: ['', Validators.required],
      nacimiento_cli: ['', Validators.required],
      telefono_cli: [''],
      nombre_usuario: ['', Validators.required],
      contrasenia: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  fillDemo(user: string, pass: string): void {
    this.loginForm.patchValue({
      nombre_usuario: user,
      contrasenia: pass
    });
    this.onLoginSubmit();
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { nombre_usuario, contrasenia } = this.loginForm.value;
    this.authService.login(nombre_usuario, contrasenia).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas o error de conexión');
      }
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message || 'Paciente registrado. Inicia sesión con tus credenciales.');
        this.isLoginMode.set(true);
        this.loginForm.patchValue({
          nombre_usuario: this.registerForm.value.nombre_usuario,
          contrasenia: this.registerForm.value.contrasenia
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al registrar paciente');
      }
    });
  }
}
