import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MedicalService } from '../../../core/services/medical.service';
import { NotificationLog } from '../../../core/models/medical.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar-container">
      <div class="navbar-content">
        <!-- Brand / Logo -->
        <div class="brand-section">
          <div class="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">SysCitas</span>
            <span class="brand-subtitle">Hospital & Clínica</span>
          </div>
        </div>

        <!-- Navigation Links by Role -->
        @if (authService.isLoggedIn()) {
          <nav class="nav-links">
            @if (authService.userRole() === 1) {
              <a routerLink="/paciente" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
                <span>📅</span> Mis Citas
              </a>
              <a routerLink="/paciente/reservar" routerLinkActive="active" class="nav-link">
                <span>➕</span> Reservar Cita
              </a>
              <a routerLink="/paciente/historial" routerLinkActive="active" class="nav-link">
                <span>📋</span> Historial Médico
              </a>
            }

            @if (authService.userRole() === 2) {
              <a routerLink="/medico" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
                <span>🩺</span> Mi Agenda
              </a>
              <a routerLink="/medico/horarios" routerLinkActive="active" class="nav-link">
                <span>⏰</span> Mis Horarios
              </a>
            }

            @if (authService.userRole() === 3) {
              <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
                <span>📊</span> Dashboard
              </a>
              <a routerLink="/admin/reservas" routerLinkActive="active" class="nav-link">
                <span>📑</span> Todas las Reservas
              </a>
              <a routerLink="/admin/recursos" routerLinkActive="active" class="nav-link">
                <span>🏥</span> Salas y Equipos
              </a>
              <a routerLink="/admin/usuarios" routerLinkActive="active" class="nav-link">
                <span>👥</span> Directorio Usuarios
              </a>
            }
          </nav>
        }

        <!-- Right Side: Notifications & User Profile -->
        <div class="actions-section">
          @if (authService.isLoggedIn()) {
            <!-- Notifications Dropdown Button -->
            <div class="notif-wrapper">
              <button class="notif-btn" (click)="toggleNotifications()" title="Ver notificaciones y recordatorios">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                @if (notifications().length > 0) {
                  <span class="notif-badge">{{ notifications().length }}</span>
                }
              </button>

              <!-- Notifications Menu -->
              @if (showNotifications()) {
                <div class="notif-dropdown">
                  <div class="notif-header">
                    <h4>Centro de Notificaciones & SMS</h4>
                    <span class="notif-count">{{ notifications().length }} avisos</span>
                  </div>
                  <div class="notif-list">
                    @for (item of notifications(); track item.id) {
                      <div class="notif-item">
                        <div class="notif-icon-tag" [ngClass]="item.tipo.toLowerCase()">
                          {{ item.tipo }}
                        </div>
                        <div class="notif-body">
                          <p class="notif-text">{{ item.mensaje }}</p>
                          <span class="notif-time">{{ item.fecha }}</span>
                        </div>
                      </div>
                    } @empty {
                      <div class="notif-empty">No hay notificaciones pendientes</div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Profile Info -->
            <div class="user-profile">
              <div class="user-avatar">
                {{ userInitials }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ authService.currentUser()?.nombre_completo }}</span>
                <span class="user-role-tag" [ngClass]="'role-' + authService.userRole()">
                  {{ authService.userRoleName() }}
                </span>
              </div>
            </div>

            <!-- Logout Button -->
            <button (click)="authService.logout()" class="btn-logout" title="Cerrar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Salir</span>
            </button>
          } @else {
            <a routerLink="/login" class="btn btn-primary btn-sm">Iniciar Sesión</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-container {
      background: #0f172a;
      color: #ffffff;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid #1e293b;
    }

    .navbar-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 4px 10px rgba(13, 148, 136, 0.4);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: #ffffff;
    }

    .brand-subtitle {
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #cbd5e1;
      transition: all 0.15s ease;
    }

    .nav-link:hover {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.08);
    }

    .nav-link.active {
      color: #ffffff;
      background-color: #0d9488;
    }

    .actions-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    /* Notifications */
    .notif-wrapper {
      position: relative;
    }

    .notif-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.15s ease;
    }

    .notif-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .notif-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #ef4444;
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #0f172a;
    }

    .notif-dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 340px;
      background: #ffffff;
      color: #0f172a;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      animation: slideUp 0.2s ease-out;
    }

    .notif-header {
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .notif-header h4 {
      font-size: 0.85rem;
      font-weight: 700;
      margin: 0;
    }

    .notif-count {
      font-size: 0.75rem;
      color: #64748b;
    }

    .notif-list {
      max-height: 280px;
      overflow-y: auto;
    }

    .notif-item {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      gap: 0.65rem;
      align-items: flex-start;
    }

    .notif-icon-tag {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      text-transform: uppercase;
      margin-top: 2px;
    }

    .notif-icon-tag.email { background: #e0f2fe; color: #0369a1; }
    .notif-icon-tag.sms { background: #dcfce7; color: #15803d; }
    .notif-icon-tag.app { background: #fef3c7; color: #b45309; }

    .notif-text {
      font-size: 0.8rem;
      line-height: 1.35;
      color: #334155;
    }

    .notif-time {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .notif-empty {
      padding: 1.5rem;
      text-align: center;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    /* User Profile */
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #14b8a6 0%, #0284c7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      color: #ffffff;
    }

    .user-meta {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.2;
      color: #ffffff;
    }

    .user-role-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-1 { color: #5eead4; }
    .role-2 { color: #7dd3fc; }
    .role-3 { color: #fcd34d; }

    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }

    .btn-logout:hover {
      background: rgba(225, 29, 72, 0.15);
      border-color: #f43f5e;
      color: #fda4af;
    }

    @media (max-width: 900px) {
      .nav-links {
        display: none;
      }
    }
  `]
})
export class NavbarComponent implements OnInit {
  notifications = signal<NotificationLog[]>([]);
  showNotifications = signal(false);

  constructor(
    public authService: AuthService,
    private medicalService: MedicalService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.medicalService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (e) => console.error(e)
    });
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.loadNotifications();
    }
  }

  get userInitials(): string {
    const name = this.authService.currentUser()?.nombre_completo || 'US';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
