import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { PatientDashboardComponent } from './features/patient/patient-dashboard.component';
import { DoctorDashboardComponent } from './features/doctor/doctor-dashboard.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // Rutas del Paciente (Rol 1)
  {
    path: 'paciente',
    component: PatientDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [1] }
  },
  {
    path: 'paciente/reservar',
    component: PatientDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [1] }
  },
  {
    path: 'paciente/historial',
    component: PatientDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [1] }
  },

  // Rutas del Médico (Rol 2)
  {
    path: 'medico',
    component: DoctorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [2] }
  },
  {
    path: 'medico/horarios',
    component: DoctorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [2] }
  },

  // Rutas del Administrador (Rol 3)
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [3] }
  },
  {
    path: 'admin/reservas',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [3] }
  },
  {
    path: 'admin/recursos',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [3] }
  },
  {
    path: 'admin/usuarios',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [3] }
  },

  { path: '**', redirectTo: 'login' }
];
