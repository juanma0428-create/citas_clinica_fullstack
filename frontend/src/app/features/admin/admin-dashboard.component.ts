import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MedicalService } from '../../core/services/medical.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { 
  Appointment, 
  DashboardStats, 
  Room, 
  Equipment, 
  Specialty, 
  Doctor,
  ScheduleSlot,
  UserSummary 
} from '../../core/models/medical.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <div class="admin-page">
      <!-- Admin Banner -->
      <div class="admin-banner">
        <div class="admin-banner-text">
          <h1>Panel de Administración General 🏥</h1>
          <p>Supervisión hospitalaria, control de ocupación, gestión de salas, equipamiento clínico y directorio de usuarios.</p>
        </div>
        <div class="banner-badge">
          <span>Administrador: {{ authService.currentUser()?.nombre_completo }}</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="admin-tabs">
        <button [class.active]="activeTab() === 'dashboard'" (click)="activeTab.set('dashboard')">
          📊 Panel de Control & Estadísticas
        </button>
        <button [class.active]="activeTab() === 'reservas'" (click)="activeTab.set('reservas')">
          📑 Gestión de Reservas ({{ appointments().length }})
        </button>
        <button [class.active]="activeTab() === 'recursos'" (click)="activeTab.set('recursos')">
          🏢 Salas y Equipos Médicos
        </button>
        <button [class.active]="activeTab() === 'usuarios'" (click)="activeTab.set('usuarios')">
          👥 Directorio de Usuarios ({{ users().length }})
        </button>
      </div>

      <!-- TAB 1: DASHBOARD & ESTADÍSTICAS -->
      @if (activeTab() === 'dashboard') {
        <div class="tab-pane">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background: #e0f2fe; color: #0284c7;">📅</div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalCitas || appointments().length }}</span>
                <span class="stat-label">Citas Totales</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: #ccfbf1; color: #0d9488;">👨‍⚕️</div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalMedicos || doctors().length }}</span>
                <span class="stat-label">Médicos Activos</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: #fef3c7; color: #d97706;">🧑‍🤝‍🧑</div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalPacientes || 2 }}</span>
                <span class="stat-label">Pacientes Registrados</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon" style="background: #f3e8ff; color: #7e22ce;">🏢</div>
              <div class="stat-info">
                <span class="stat-value">{{ stats()?.totalSalas || rooms().length }}</span>
                <span class="stat-label">Salas de Consulta</span>
              </div>
            </div>
          </div>

          <div class="metrics-grid">
            <!-- Citas por Especialidad -->
            <div class="card metric-box">
              <div class="card-header">
                <h3 class="card-title">🩺 Citas por Especialidad</h3>
              </div>
              <div class="chart-bars">
                @for (item of stats()?.citasPorEspecialidad; track item.nombre_especialidad) {
                  <div class="bar-row">
                    <div class="bar-info">
                      <span class="bar-name">{{ item.nombre_especialidad }}</span>
                      <span class="bar-val">{{ item.total }} citas</span>
                    </div>
                    <div class="bar-track">
                      <div class="bar-fill" [style.width.%]="getPercentage(item.total, appointments().length)"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Distribución por Estado -->
            <div class="card metric-box">
              <div class="card-header">
                <h3 class="card-title">📈 Estado de las Reservas</h3>
              </div>
              <div class="status-summary-cards">
                @for (s of stats()?.citasPorEstado; track s.estado_cita) {
                  <div class="status-summary-item" [ngClass]="'status-' + s.estado_cita">
                    <span class="ss-total">{{ s.total }}</span>
                    <span class="ss-label">{{ s.estado_cita | uppercase }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: TODAS LAS RESERVAS (APROBAR, RECHAZAR, MODIFICAR) -->
      @if (activeTab() === 'reservas') {
        <div class="tab-pane">
          <div class="section-header">
            <div>
              <h2>Auditoría y Gestión Global de Reservas</h2>
              <p>Opciones administrativas para aprobar, rechazar o modificar médico, sala y horario de cualquier reserva.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="loadData()">🔄 Actualizar Datos</button>
          </div>

          <div class="table-responsive card" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th># Cita</th>
                  <th>Paciente</th>
                  <th>Especialista</th>
                  <th>Especialidad</th>
                  <th>Fecha & Hora</th>
                  <th>Sala</th>
                  <th>Estado</th>
                  <th>Acciones Administrativas</th>
                </tr>
              </thead>
              <tbody>
                @for (cita of appointments(); track cita.id_cita) {
                  <tr>
                    <td><strong>#{{ cita.id_cita }}</strong></td>
                    <td>{{ cita.nombre_cli }} {{ cita.apellido_cli }}</td>
                    <td>Dr(a). {{ cita.nombre_med }} {{ cita.apellido_med }}</td>
                    <td>{{ cita.nombre_especialidad }}</td>
                    <td>
                      <strong>{{ cita.fecha }}</strong><br>
                      <small style="color: #0284c7; font-weight: 700;">{{ cita.hora_reserva }}</small>
                    </td>
                    <td>{{ cita.nombre_sala }}</td>
                    <td>
                      <app-status-badge [status]="cita.estado_cita"></app-status-badge>
                    </td>
                    <td>
                      <div class="table-actions">
                        @if (cita.estado_cita === 'pendiente') {
                          <button class="btn btn-primary btn-sm" (click)="approveAppointment(cita.id_cita)" title="Aprobar reserva">
                            ✅ Aprobar
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="rejectAppointment(cita.id_cita)" title="Rechazar y liberar horario">
                            ❌ Rechazar
                          </button>
                        }
                        @if (cita.estado_cita !== 'cancelada' && cita.estado_cita !== 'finalizada') {
                          <button class="btn btn-secondary btn-sm" (click)="openModifyAppointmentModal(cita)" title="Modificar sala, médico o fecha">
                            ✏️ Modificar
                          </button>
                          @if (cita.estado_cita === 'confirmada') {
                            <button class="btn btn-danger btn-sm" (click)="rejectAppointment(cita.id_cita)" title="Cancelar cita">
                              Cancelar
                            </button>
                          }
                        } @else {
                          <span style="color: #94a3b8; font-size: 0.8rem;">Cerrada</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: SALAS Y RECURSOS -->
      @if (activeTab() === 'recursos') {
        <div class="tab-pane">
          <div class="resources-layout">
            <!-- Consultorios / Salas -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">🏢 Consultorios / Salas de Consulta</h3>
                <button class="btn btn-primary btn-sm" (click)="showNewRoomForm.set(!showNewRoomForm())">
                  {{ showNewRoomForm() ? 'Cerrar' : '➕ Nueva Sala' }}
                </button>
              </div>

              @if (showNewRoomForm()) {
                <form [formGroup]="roomForm" (ngSubmit)="submitRoom()" class="inline-form">
                  <div class="form-group">
                    <label class="form-label">Nombre Sala:</label>
                    <input type="text" class="form-control" formControlName="nombre_sala" placeholder="ej. Consultorio C3" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Especialidad:</label>
                    <select class="form-control" formControlName="id_especialidad">
                      @for (esp of specialties(); track esp.id_especialidad) {
                        <option [value]="esp.id_especialidad">{{ esp.nombre_especialidad }}</option>
                      }
                    </select>
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="roomForm.invalid">Guardar Sala</button>
                </form>
              }

              <div class="table-responsive" style="margin-top: 1rem;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Sala</th>
                      <th>Especialidad Asociada</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of rooms(); track r.id_sala) {
                      <tr>
                        <td>{{ r.id_sala }}</td>
                        <td><strong>{{ r.nombre_sala }}</strong></td>
                        <td>{{ r.nombre_especialidad }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Equipamiento Médico -->
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">🔬 Equipos Médicos e Instrumental</h3>
                <button class="btn btn-primary btn-sm" (click)="showNewEquipForm.set(!showNewEquipForm())">
                  {{ showNewEquipForm() ? 'Cerrar' : '➕ Nuevo Equipo' }}
                </button>
              </div>

              @if (showNewEquipForm()) {
                <form [formGroup]="equipmentForm" (ngSubmit)="submitEquipment()" class="inline-form">
                  <div class="form-group">
                    <label class="form-label">Nombre del Equipo:</label>
                    <input type="text" class="form-control" formControlName="nombre" placeholder="ej. Electrocardiógrafo" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Especialidad:</label>
                    <select class="form-control" formControlName="id_especialidad">
                      @for (esp of specialties(); track esp.id_especialidad) {
                        <option [value]="esp.id_especialidad">{{ esp.nombre_especialidad }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cantidad:</label>
                    <input type="number" class="form-control" formControlName="cantidad" min="1" />
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="equipmentForm.invalid">Guardar Equipo</button>
                </form>
              }

              <div class="table-responsive" style="margin-top: 1rem;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Especialidad</th>
                      <th>Cantidad</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (eq of equipment(); track eq.id_equipo) {
                      <tr>
                        <td><strong>{{ eq.nombre }}</strong></td>
                        <td>{{ eq.nombre_especialidad }}</td>
                        <td>{{ eq.cantidad }} unidades</td>
                        <td>
                          <span class="badge badge-finalizada">Operativo</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 4: DIRECTORIO DE USUARIOS (CRUD COMPLETO) -->
      @if (activeTab() === 'usuarios') {
        <div class="tab-pane">
          <div class="section-header">
            <div>
              <h2>Directorio General de Usuarios (CRUD Completo)</h2>
              <p>Creación, visualización, modificación de datos/credenciales y baja de usuarios.</p>
            </div>
            <button class="btn btn-primary" (click)="openCreateUserModal()">
              <span>➕</span> Registrar Nuevo Usuario
            </button>
          </div>

          <div class="table-responsive card" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Teléfono</th>
                  <th>Especialidad / Detalle</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of users(); track u.id_usuario) {
                  <tr>
                    <td>{{ u.id_usuario }}</td>
                    <td><strong>{{ u.nombre_completo }}</strong></td>
                    <td><code>{{ u.nombre_usuario }}</code></td>
                    <td>
                      <span class="badge" [ngClass]="'badge-' + (u.id_rol === 1 ? 'confirmada' : u.id_rol === 2 ? 'finalizada' : 'pendiente')">
                        {{ u.nombre_rol }}
                      </span>
                    </td>
                    <td>{{ u.telefono }}</td>
                    <td>
                      @if (u.id_rol === 2) {
                        <span style="font-size: 0.85rem; color: #0284c7; font-weight: 600;">{{ u.nombre_especialidad || 'Especialista' }}</span>
                      } @else if (u.id_rol === 1) {
                        <span style="font-size: 0.8rem; color: #64748b;">Nac: {{ u.nacimiento_cli || 'N/D' }}</span>
                      } @else {
                        <span style="font-size: 0.8rem; color: #d97706;">Acceso Total</span>
                      }
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-secondary btn-sm" (click)="openEditUserModal(u)" title="Editar usuario y credenciales">
                          ✏️ Editar
                        </button>
                        <button 
                          class="btn btn-danger btn-sm" 
                          (click)="deleteUser(u.id_usuario)" 
                          [disabled]="u.id_usuario === authService.currentUser()?.id_usuario"
                          title="Eliminar usuario"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL CREAR CUALQUIER USUARIO (PACIENTE, MÉDICO, ADMIN) -->
      @if (showCreateUserModal()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Crear Nuevo Usuario en el Sistema</h3>
              <p>Selecciona el tipo de cuenta y completa sus datos.</p>
            </div>

            <form [formGroup]="createUserForm" (ngSubmit)="submitCreateUser()" style="margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Tipo de Rol:</label>
                <select class="form-control" formControlName="id_rol" (change)="onRouteChange()">
                  <option [value]="1">Paciente</option>
                  <option [value]="2">Médico</option>
                  <option [value]="3">Administrador</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre:</label>
                  <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre" />
                </div>
                <div class="form-group">
                  <label class="form-label">Apellido:</label>
                  <input type="text" class="form-control" formControlName="apellido" placeholder="Apellido" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Teléfono:</label>
                  <input type="text" class="form-control" formControlName="telefono" placeholder="ej. 5555-4321" />
                </div>
                @if (createUserForm.get('id_rol')?.value == 1) {
                  <div class="form-group">
                    <label class="form-label">Fecha Nacimiento:</label>
                    <input type="date" class="form-control" formControlName="nacimiento_cli" />
                  </div>
                }
                @if (createUserForm.get('id_rol')?.value == 2) {
                  <div class="form-group">
                    <label class="form-label">Especialidad Médica:</label>
                    <select class="form-control" formControlName="id_especialidad">
                      @for (esp of specialties(); track esp.id_especialidad) {
                        <option [value]="esp.id_especialidad">{{ esp.nombre_especialidad }}</option>
                      }
                    </select>
                  </div>
                }
              </div>

              @if (createUserForm.get('id_rol')?.value == 2) {
                <div class="form-group">
                  <label class="form-label">Equipos Disponibles en su Consulta:</label>
                  <input type="text" class="form-control" formControlName="equipo_disponible" placeholder="ej. Estetoscopio, Tensiómetro, Linterna" />
                </div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre de Usuario:</label>
                  <input type="text" class="form-control" formControlName="nombre_usuario" placeholder="ej. usuario_123" />
                </div>
                <div class="form-group">
                  <label class="form-label">Contraseña:</label>
                  <input type="password" class="form-control" formControlName="contrasenia" placeholder="Contraseña de acceso" />
                </div>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" (click)="showCreateUserModal.set(false)">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="createUserForm.invalid || isSubmittingUser()">
                  @if (isSubmittingUser()) {
                    <span>Guardando...</span>
                  } @else {
                    <span>Crear Usuario</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL EDITAR USUARIO -->
      @if (editingUser()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Editar Usuario: {{ editingUser()?.nombre_completo }}</h3>
              <span class="badge" [ngClass]="'badge-' + (editingUser()?.id_rol === 1 ? 'confirmada' : editingUser()?.id_rol === 2 ? 'finalizada' : 'pendiente')">
                {{ editingUser()?.nombre_rol }}
              </span>
            </div>

            <form [formGroup]="editUserForm" (ngSubmit)="submitEditUser()" style="margin-top: 1rem;">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nombre:</label>
                  <input type="text" class="form-control" formControlName="nombre" />
                </div>
                <div class="form-group">
                  <label class="form-label">Apellido:</label>
                  <input type="text" class="form-control" formControlName="apellido" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Teléfono:</label>
                  <input type="text" class="form-control" formControlName="telefono" />
                </div>
                @if (editingUser()?.id_rol === 1) {
                  <div class="form-group">
                    <label class="form-label">Fecha Nacimiento:</label>
                    <input type="date" class="form-control" formControlName="nacimiento_cli" />
                  </div>
                }
                @if (editingUser()?.id_rol === 2) {
                  <div class="form-group">
                    <label class="form-label">Especialidad:</label>
                    <select class="form-control" formControlName="id_especialidad">
                      @for (esp of specialties(); track esp.id_especialidad) {
                        <option [value]="esp.id_especialidad">{{ esp.nombre_especialidad }}</option>
                      }
                    </select>
                  </div>
                }
              </div>

              @if (editingUser()?.id_rol === 2) {
                <div class="form-group">
                  <label class="form-label">Equipos asignados:</label>
                  <input type="text" class="form-control" formControlName="equipo_disponible" />
                </div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Usuario:</label>
                  <input type="text" class="form-control" formControlName="nombre_usuario" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nueva Contraseña (opcional):</label>
                  <input type="password" class="form-control" formControlName="contrasenia" placeholder="Dejar en blanco para no cambiar" />
                </div>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" (click)="editingUser.set(null)">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="editUserForm.invalid || isSubmittingEdit()">
                  @if (isSubmittingEdit()) {
                    <span>Actualizando...</span>
                  } @else {
                    <span>Guardar Cambios</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL MODIFICAR RESERVA (ADMIN) -->
      @if (modifyingAppointment()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Modificar Reserva #{{ modifyingAppointment()?.id_cita }}</h3>
              <p>Paciente: <strong>{{ modifyingAppointment()?.nombre_cli }} {{ modifyingAppointment()?.apellido_cli }}</strong></p>
            </div>

            <form [formGroup]="modifyAppForm" (ngSubmit)="submitModifyAppointment()" style="margin-top: 1rem;">
              <div class="form-group">
                <label class="form-label">Médico Especialista:</label>
                <select class="form-control" formControlName="id_medico" (change)="onDoctorChangeInModify()">
                  @for (doc of doctors(); track doc.id_medico) {
                    <option [value]="doc.id_medico">Dr(a). {{ doc.nombre_med }} {{ doc.apellido_med }} ({{ doc.nombre_especialidad }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Franja Horaria:</label>
                @if (loadingModifySchedules()) {
                  <p>Cargando horarios disponibles...</p>
                } @else {
                  <select class="form-control" formControlName="id_horario">
                    @for (s of modifyDoctorSchedules(); track s.id_horario) {
                      <option [value]="s.id_horario">{{ s.fecha }} — {{ s.hora_reserva }} {{ s.disponibilidad === 1 ? '(Libre)' : '(Actual)' }}</option>
                    }
                  </select>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Consultorio / Sala:</label>
                  <select class="form-control" formControlName="id_sala">
                    @for (r of rooms(); track r.id_sala) {
                      <option [value]="r.id_sala">{{ r.nombre_sala }} ({{ r.nombre_especialidad }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estado de la Cita:</label>
                  <select class="form-control" formControlName="estado_cita">
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="finalizada">Finalizada</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Motivo de la Consulta:</label>
                <textarea class="form-control" rows="3" formControlName="motivo_consulta"></textarea>
              </div>

              <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" (click)="modifyingAppointment.set(null)">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="modifyAppForm.invalid || isSubmittingModifyApp()">
                  @if (isSubmittingModifyApp()) {
                    <span>Guardando cambios...</span>
                  } @else {
                    <span>Confirmar Modificación</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1350px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .admin-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
    }

    .admin-banner-text h1 {
      color: #ffffff;
      font-size: 1.65rem;
      margin-bottom: 0.35rem;
    }

    .admin-banner-text p {
      color: #c7d2fe;
      font-size: 0.9rem;
      max-width: 700px;
    }

    .banner-badge {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 30px;
      font-size: 0.85rem;
      color: #e0e7ff;
      font-weight: 600;
    }

    .admin-tabs {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.75rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }

    .admin-tabs button {
      background: transparent;
      border: none;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748b;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .admin-tabs button.active {
      background: #4f46e5;
      color: #ffffff;
    }

    .table-actions {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .chart-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-row {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .bar-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .bar-track {
      height: 10px;
      background: #f1f5f9;
      border-radius: 9999px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0d9488, #06b6d4);
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .status-summary-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .status-summary-item {
      padding: 1.25rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1.5px solid transparent;
    }

    .ss-total {
      font-size: 2rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
    }

    .ss-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .status-confirmada { background: #e0f2fe; color: #0284c7; border-color: #bae6fd; }
    .status-pendiente { background: #fef3c7; color: #d97706; border-color: #fde68a; }
    .status-finalizada { background: #d1fae5; color: #059669; border-color: #a7f3d0; }
    .status-cancelada { background: #ffe4e6; color: #e11d48; border-color: #fecdd3; }

    .resources-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .inline-form {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-bottom: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    @media (max-width: 900px) {
      .metrics-grid, .resources-layout {
        grid-template-columns: 1fr;
      }
      .admin-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = signal<'dashboard' | 'reservas' | 'recursos' | 'usuarios'>('dashboard');

  stats = signal<DashboardStats | null>(null);
  appointments = signal<Appointment[]>([]);
  rooms = signal<Room[]>([]);
  equipment = signal<Equipment[]>([]);
  specialties = signal<Specialty[]>([]);
  doctors = signal<Doctor[]>([]);
  users = signal<UserSummary[]>([]);

  // Modals & Forms
  showNewRoomForm = signal(false);
  roomForm: FormGroup;

  showNewEquipForm = signal(false);
  equipmentForm: FormGroup;

  // Unified User Creation
  showCreateUserModal = signal(false);
  createUserForm: FormGroup;
  isSubmittingUser = signal(false);

  // User Edit
  editingUser = signal<UserSummary | null>(null);
  editUserForm: FormGroup;
  isSubmittingEdit = signal(false);

  // Appointment Modification
  modifyingAppointment = signal<Appointment | null>(null);
  modifyAppForm: FormGroup;
  modifyDoctorSchedules = signal<ScheduleSlot[]>([]);
  loadingModifySchedules = signal(false);
  isSubmittingModifyApp = signal(false);

  constructor(
    public authService: AuthService,
    private medicalService: MedicalService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.roomForm = this.fb.group({
      nombre_sala: ['', Validators.required],
      id_especialidad: [1, Validators.required]
    });

    this.equipmentForm = this.fb.group({
      nombre: ['', Validators.required],
      id_especialidad: [1, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });

    this.createUserForm = this.fb.group({
      id_rol: [2, Validators.required],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''],
      nacimiento_cli: ['2000-01-01'],
      id_especialidad: [1],
      equipo_disponible: [''],
      nombre_usuario: ['', Validators.required],
      contrasenia: ['', Validators.required]
    });

    this.editUserForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      telefono: [''],
      nacimiento_cli: [''],
      id_especialidad: [1],
      equipo_disponible: [''],
      nombre_usuario: ['', Validators.required],
      contrasenia: ['']
    });

    this.modifyAppForm = this.fb.group({
      id_medico: [null, Validators.required],
      id_horario: [null, Validators.required],
      id_sala: [null, Validators.required],
      estado_cita: ['confirmada', Validators.required],
      motivo_consulta: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.url.subscribe(segments => {
      const path = segments[0]?.path;
      if (path === 'reservas') this.activeTab.set('reservas');
      if (path === 'recursos') this.activeTab.set('recursos');
      if (path === 'usuarios') this.activeTab.set('usuarios');
    });

    this.loadData();
  }

  loadData(): void {
    this.medicalService.getDashboardStats().subscribe({
      next: (s) => this.stats.set(s),
      error: (e) => console.error(e)
    });

    this.medicalService.getAppointments().subscribe({
      next: (a) => this.appointments.set(a),
      error: (e) => console.error(e)
    });

    this.medicalService.getRooms().subscribe({
      next: (r) => this.rooms.set(r),
      error: (e) => console.error(e)
    });

    this.medicalService.getEquipment().subscribe({
      next: (eq) => this.equipment.set(eq),
      error: (e) => console.error(e)
    });

    this.medicalService.getSpecialties().subscribe({
      next: (esp) => this.specialties.set(esp),
      error: (e) => console.error(e)
    });

    this.medicalService.getDoctors().subscribe({
      next: (docs) => this.doctors.set(docs),
      error: (e) => console.error(e)
    });

    this.medicalService.getUsers().subscribe({
      next: (u) => this.users.set(u),
      error: (e) => console.error(e)
    });
  }

  getPercentage(total: number, overall: number): number {
    if (!overall || overall === 0) return 0;
    return Math.min(100, Math.round((total / overall) * 100));
  }

  // -------------------------
  // RESERVATION ACTIONS
  // -------------------------
  approveAppointment(id_cita: number): void {
    this.medicalService.approveAppointment(id_cita).subscribe({
      next: () => this.loadData(),
      error: (e) => alert(e.error?.message || 'Error al aprobar cita')
    });
  }

  rejectAppointment(id_cita: number): void {
    if (confirm('¿Desea rechazar/cancelar administrativamente esta cita? El horario asignado será liberado.')) {
      this.medicalService.rejectAppointment(id_cita).subscribe({
        next: () => this.loadData(),
        error: (e) => alert(e.error?.message || 'Error al rechazar cita')
      });
    }
  }

  openModifyAppointmentModal(cita: Appointment): void {
    this.modifyingAppointment.set(cita);
    this.modifyAppForm.patchValue({
      id_medico: cita.id_medico,
      id_horario: cita.id_horario,
      id_sala: cita.id_sala,
      estado_cita: cita.estado_cita,
      motivo_consulta: cita.motivo_consulta
    });

    this.loadSchedulesForModify(cita.id_medico, cita.id_horario);
  }

  onDoctorChangeInModify(): void {
    const docId = Number(this.modifyAppForm.get('id_medico')?.value);
    if (docId) {
      this.loadSchedulesForModify(docId);
    }
  }

  loadSchedulesForModify(docId: number, currentSlotId?: number): void {
    this.loadingModifySchedules.set(true);
    this.medicalService.getDoctorSchedules(docId, false).subscribe({
      next: (slots) => {
        // Show available slots or current slot
        const validSlots = slots.filter(s => s.disponibilidad === 1 || s.id_horario === currentSlotId);
        this.modifyDoctorSchedules.set(validSlots);
        this.loadingModifySchedules.set(false);
      },
      error: () => this.loadingModifySchedules.set(false)
    });
  }

  submitModifyAppointment(): void {
    const cita = this.modifyingAppointment();
    if (!cita || this.modifyAppForm.invalid) return;

    this.isSubmittingModifyApp.set(true);
    this.medicalService.modifyAppointment(cita.id_cita, this.modifyAppForm.value).subscribe({
      next: () => {
        this.isSubmittingModifyApp.set(false);
        this.modifyingAppointment.set(null);
        this.loadData();
      },
      error: (e) => {
        this.isSubmittingModifyApp.set(false);
        alert(e.error?.message || 'Error al modificar cita');
      }
    });
  }

  // -------------------------
  // USER CRUD ACTIONS
  // -------------------------
  openCreateUserModal(): void {
    this.createUserForm.reset({
      id_rol: 2,
      id_especialidad: 1,
      nacimiento_cli: '2000-01-01'
    });
    this.showCreateUserModal.set(true);
  }

  onRouteChange(): void {
    // Dynamic adjustments if needed
  }

  submitCreateUser(): void {
    if (this.createUserForm.invalid) return;
    this.isSubmittingUser.set(true);

    this.medicalService.createUser(this.createUserForm.value).subscribe({
      next: () => {
        this.isSubmittingUser.set(false);
        this.showCreateUserModal.set(false);
        this.loadData();
      },
      error: (e) => {
        this.isSubmittingUser.set(false);
        alert(e.error?.message || 'Error al crear usuario');
      }
    });
  }

  openEditUserModal(user: UserSummary): void {
    this.editingUser.set(user);
    this.editUserForm.patchValue({
      nombre: user.nombre || user.nombre_completo.split(' ')[0] || '',
      apellido: user.apellido || user.nombre_completo.split(' ').slice(1).join(' ') || '',
      telefono: user.telefono === 'N/A' ? '' : user.telefono,
      nacimiento_cli: user.nacimiento_cli || '',
      id_especialidad: user.id_especialidad || 1,
      equipo_disponible: user.equipo_disponible || '',
      nombre_usuario: user.nombre_usuario,
      contrasenia: ''
    });
  }

  submitEditUser(): void {
    const user = this.editingUser();
    if (!user || this.editUserForm.invalid) return;

    this.isSubmittingEdit.set(true);
    const formVal = { ...this.editUserForm.value };
    if (!formVal.contrasenia) delete formVal.contrasenia;

    this.medicalService.updateUser(user.id_usuario, formVal).subscribe({
      next: () => {
        this.isSubmittingEdit.set(false);
        this.editingUser.set(null);
        this.loadData();
      },
      error: (e) => {
        this.isSubmittingEdit.set(false);
        alert(e.error?.message || 'Error al actualizar usuario');
      }
    });
  }

  deleteUser(id_usuario: number): void {
    if (confirm(`¿Estás seguro de eliminar al usuario #${id_usuario}? Esta acción no se puede deshacer.`)) {
      this.medicalService.deleteUser(id_usuario).subscribe({
        next: () => this.loadData(),
        error: (e) => alert(e.error?.message || 'Error al eliminar usuario')
      });
    }
  }

  // -------------------------
  // RESOURCES ACTIONS
  // -------------------------
  submitRoom(): void {
    if (this.roomForm.invalid) return;
    const { nombre_sala, id_especialidad } = this.roomForm.value;
    this.medicalService.createRoom(nombre_sala, Number(id_especialidad)).subscribe({
      next: () => {
        this.showNewRoomForm.set(false);
        this.roomForm.reset({ id_especialidad: 1 });
        this.loadData();
      },
      error: (e) => alert(e.error?.message || 'Error al crear sala')
    });
  }

  submitEquipment(): void {
    if (this.equipmentForm.invalid) return;
    const { nombre, id_especialidad, cantidad } = this.equipmentForm.value;
    this.medicalService.createEquipment(nombre, Number(id_especialidad), Number(cantidad)).subscribe({
      next: () => {
        this.showNewEquipForm.set(false);
        this.equipmentForm.reset({ id_especialidad: 1, cantidad: 1 });
        this.loadData();
      },
      error: (e) => alert(e.error?.message || 'Error al registrar equipo')
    });
  }
}
