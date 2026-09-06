import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MedicalService } from '../../core/services/medical.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { Appointment, ScheduleSlot } from '../../core/models/medical.models';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <div class="doctor-page">
      <!-- Doctor Header Banner -->
      <div class="doctor-banner">
        <div class="doctor-banner-info">
          <div class="doc-badge-icon">👨‍⚕️</div>
          <div>
            <h1>Portal Médico: {{ authService.currentUser()?.nombre_completo }}</h1>
            <p>Gestiona tu agenda de pacientes, registra consultas clínicas y programa nuevos horarios de atención.</p>
          </div>
        </div>
        <div class="banner-quick-stats">
          <div class="quick-stat">
            <span class="qs-num">{{ pendingAppointmentsCount() }}</span>
            <span class="qs-lbl">Por Atender</span>
          </div>
          <div class="quick-stat">
            <span class="qs-num">{{ finishedAppointmentsCount() }}</span>
            <span class="qs-lbl">Atendidas</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="doctor-tabs">
        <button [class.active]="activeTab() === 'agenda'" (click)="activeTab.set('agenda')">
          📋 Mi Agenda de Citas ({{ appointments().length }})
        </button>
        <button [class.active]="activeTab() === 'horarios'" (click)="activeTab.set('horarios')">
          ⏰ Gestión de Horarios & Disponibilidad
        </button>
      </div>

      <!-- TAB 1: AGENDA DE CITAS -->
      @if (activeTab() === 'agenda') {
        <div class="tab-pane">
          <div class="filter-bar card">
            <span class="filter-label">Filtrar por estado:</span>
            <div class="filter-chips">
              <button [class.active]="statusFilter() === 'todos'" (click)="statusFilter.set('todos')">Todos ({{ appointments().length }})</button>
              <button [class.active]="statusFilter() === 'confirmada'" (click)="statusFilter.set('confirmada')">Confirmadas</button>
              <button [class.active]="statusFilter() === 'pendiente'" (click)="statusFilter.set('pendiente')">Pendientes</button>
              <button [class.active]="statusFilter() === 'finalizada'" (click)="statusFilter.set('finalizada')">Finalizadas</button>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-left: auto" (click)="loadAppointments()">🔄 Refrescar</button>
          </div>

          <div class="table-responsive card" style="padding: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th>Cita #</th>
                  <th>Paciente</th>
                  <th>Fecha & Hora</th>
                  <th>Consultorio</th>
                  <th>Motivo de Consulta</th>
                  <th>Estado</th>
                  <th>Acción Clínica</th>
                </tr>
              </thead>
              <tbody>
                @for (cita of filteredAppointments(); track cita.id_cita) {
                  <tr>
                    <td><strong>#{{ cita.id_cita }}</strong></td>
                    <td>
                      <div class="patient-cell">
                        <strong>{{ cita.nombre_cli }} {{ cita.apellido_cli }}</strong>
                        <span class="patient-tel">📞 {{ cita.telefono_cli || 'Sin teléfono' }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="time-cell">
                        <span class="cell-date">{{ cita.fecha }}</span>
                        <span class="cell-time">{{ cita.hora_reserva }}</span>
                      </div>
                    </td>
                    <td>{{ cita.nombre_sala }}</td>
                    <td>
                      <span class="motive-text">{{ cita.motivo_consulta }}</span>
                    </td>
                    <td>
                      <app-status-badge [status]="cita.estado_cita"></app-status-badge>
                    </td>
                    <td>
                      @if (cita.estado_cita === 'confirmada' || cita.estado_cita === 'pendiente') {
                        <button class="btn btn-primary btn-sm" (click)="openConsultModal(cita)">
                          🩺 Atender Paciente
                        </button>
                      } @else if (cita.estado_cita === 'finalizada') {
                        <button class="btn btn-secondary btn-sm" (click)="openConsultModal(cita)">
                          👁️ Ver Registro
                        </button>
                      } @else {
                        <span style="color: #94a3b8; font-size: 0.8rem;">Cancelada</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="text-center" style="padding: 3rem; text-align: center; color: #94a3b8;">
                      No hay citas para mostrar en este filtro.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: GESTIÓN DE HORARIOS -->
      @if (activeTab() === 'horarios') {
        <div class="tab-pane">
          <div class="schedule-management-grid">
            <!-- Add Schedule Form -->
            <div class="card add-schedule-card">
              <div class="card-header">
                <h3 class="card-title">➕ Habilitar Nueva Franja Horaria</h3>
              </div>

              @if (scheduleSuccessMsg()) {
                <div class="alert alert-success">
                  <span>✅</span> {{ scheduleSuccessMsg() }}
                </div>
              }
              @if (scheduleErrorMsg()) {
                <div class="alert alert-error">
                  <span>⚠️</span> {{ scheduleErrorMsg() }}
                </div>
              }

              <form [formGroup]="scheduleForm" (ngSubmit)="submitSchedule()">
                <div class="form-group">
                  <label class="form-label">Fecha de Atención:</label>
                  <input type="date" class="form-control" formControlName="fecha" />
                </div>

                <div class="form-group">
                  <label class="form-label">Hora de la Consulta:</label>
                  <input type="time" class="form-control" formControlName="hora_reserva" step="1800" />
                  <small style="color: #64748b; font-size: 0.75rem; margin-top: 2px;">Formato recomendado en intervalos de 30 o 60 minutos (ej. 09:00, 10:00, 15:30).</small>
                </div>

                <button type="submit" class="btn btn-primary btn-block" [disabled]="scheduleForm.invalid || isSubmittingSchedule()">
                  @if (isSubmittingSchedule()) {
                    <span>Guardando franja...</span>
                  } @else {
                    <span>Publicar Horario Disponible</span>
                  }
                </button>
              </form>
            </div>

            <!-- Existing Schedules List -->
            <div class="card existing-schedules-card">
              <div class="card-header">
                <h3 class="card-title">📅 Mis Franjas Horarias Registradas</h3>
                <span class="badge badge-confirmada">{{ mySchedules().length }} franjas</span>
              </div>

              <div class="schedules-list">
                @for (slot of mySchedules(); track slot.id_horario) {
                  <div class="schedule-item-row" [class.reserved]="slot.disponibilidad === 0">
                    <div class="si-time">
                      <strong>{{ slot.fecha }}</strong>
                      <span>{{ slot.hora_reserva }}</span>
                    </div>
                    <div>
                      @if (slot.disponibilidad === 1) {
                        <span class="badge badge-finalizada">Disponible para Pacientes</span>
                      } @else {
                        <span class="badge badge-pendiente">Cita Agendada (Ocupado)</span>
                      }
                    </div>
                  </div>
                } @empty {
                  <p class="no-data">No has registrado franjas horarias todavía.</p>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- MODAL ATENCIÓN CLÍNICA (DIAGNÓSTICO Y RECETA) -->
      @if (selectedAppointment()) {
        <div class="modal-backdrop">
          <div class="modal-card consult-modal">
            <div class="modal-header">
              <h3>Registro de Atención Médica — Cita #{{ selectedAppointment()?.id_cita }}</h3>
              <p>Paciente: <strong>{{ selectedAppointment()?.nombre_cli }} {{ selectedAppointment()?.apellido_cli }}</strong> ({{ selectedAppointment()?.fecha }} - {{ selectedAppointment()?.hora_reserva }})</p>
            </div>

            <div class="modal-body">
              <div class="motive-banner">
                <strong>Motivo de consulta del paciente:</strong>
                <p>{{ selectedAppointment()?.motivo_consulta }}</p>
              </div>

              <form [formGroup]="consultForm">
                <div class="form-group">
                  <label class="form-label">Diagnóstico Clínico:</label>
                  <textarea 
                    class="form-control" 
                    rows="3" 
                    formControlName="diagnosticos"
                    placeholder="Ej. Rinofaringitis aguda, signos vitales estables, sin complicaciones..."
                  ></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Receta Médica y Tratamiento Farmacológico:</label>
                  <textarea 
                    class="form-control" 
                    rows="4" 
                    formControlName="recetas"
                    placeholder="Ej. Paracetamol 500mg cada 8 horas por 3 días. Reposo relativo, abundante hidratación..."
                  ></textarea>
                </div>
              </form>
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button class="btn btn-secondary" (click)="selectedAppointment.set(null)">Cerrar</button>
              @if (selectedAppointment()?.estado_cita !== 'finalizada') {
                <button 
                  class="btn btn-primary" 
                  [disabled]="consultForm.invalid || isSubmittingConsult()"
                  (click)="submitConsult()"
                >
                  @if (isSubmittingConsult()) {
                    <span>Guardando consulta...</span>
                  } @else {
                    <span>💾 Guardar Diagnóstico y Finalizar Cita</span>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .doctor-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .doctor-banner {
      background: linear-gradient(135deg, #0f172a 0%, #0369a1 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
    }

    .doctor-banner-info {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .doc-badge-icon {
      font-size: 3rem;
      background: rgba(255, 255, 255, 0.1);
      width: 70px;
      height: 70px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .doctor-banner-info h1 {
      color: #ffffff;
      font-size: 1.6rem;
      margin-bottom: 0.25rem;
    }

    .doctor-banner-info p {
      color: #e0f2fe;
      font-size: 0.9rem;
      max-width: 600px;
    }

    .banner-quick-stats {
      display: flex;
      gap: 1.25rem;
    }

    .quick-stat {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1.25rem;
      text-align: center;
      display: flex;
      flex-direction: column;
    }

    .qs-num {
      font-size: 1.6rem;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
    }

    .qs-lbl {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #bae6fd;
    }

    .doctor-tabs {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
    }

    .doctor-tabs button {
      background: transparent;
      border: none;
      font-size: 0.95rem;
      font-weight: 700;
      color: #64748b;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      transition: all 0.15s ease;
    }

    .doctor-tabs button.active {
      background: #0284c7;
      color: #ffffff;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      padding: 0.85rem 1.25rem;
    }

    .filter-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #64748b;
    }

    .filter-chips {
      display: flex;
      gap: 0.5rem;
    }

    .filter-chips button {
      background: #f1f5f9;
      border: none;
      border-radius: 6px;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      transition: all 0.15s ease;
    }

    .filter-chips button.active {
      background: #0284c7;
      color: #ffffff;
    }

    .patient-cell {
      display: flex;
      flex-direction: column;
    }

    .patient-tel {
      font-size: 0.75rem;
      color: #64748b;
    }

    .time-cell {
      display: flex;
      flex-direction: column;
    }

    .cell-date {
      font-weight: 600;
    }

    .cell-time {
      font-size: 0.8rem;
      color: #0284c7;
      font-weight: 700;
    }

    .motive-text {
      max-width: 250px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #475569;
    }

    /* Schedules management */
    .schedule-management-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
    }

    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 500px;
      overflow-y: auto;
    }

    .schedule-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    .schedule-item-row.reserved {
      background: #fffbeb;
      border-color: #fde68a;
    }

    .si-time strong {
      font-size: 0.95rem;
      margin-right: 0.5rem;
    }

    .si-time span {
      font-weight: 700;
      color: #0284c7;
    }

    .motive-banner {
      background: #f1f5f9;
      padding: 0.85rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      border-left: 3px solid #0284c7;
    }

    .motive-banner strong {
      font-size: 0.85rem;
      color: #334155;
      display: block;
    }

    .motive-banner p {
      font-size: 0.9rem;
      color: #0f172a;
      margin-top: 0.25rem;
    }

    .consult-modal {
      max-width: 650px;
    }

    @media (max-width: 850px) {
      .schedule-management-grid {
        grid-template-columns: 1fr;
      }
      .doctor-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.25rem;
      }
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  activeTab = signal<'agenda' | 'horarios'>('agenda');
  statusFilter = signal<string>('todos');

  appointments = signal<Appointment[]>([]);
  mySchedules = signal<ScheduleSlot[]>([]);

  selectedAppointment = signal<Appointment | null>(null);
  consultForm: FormGroup;
  isSubmittingConsult = signal(false);

  scheduleForm: FormGroup;
  isSubmittingSchedule = signal(false);
  scheduleSuccessMsg = signal<string | null>(null);
  scheduleErrorMsg = signal<string | null>(null);

  constructor(
    public authService: AuthService,
    private medicalService: MedicalService,
    private fb: FormBuilder
  ) {
    this.consultForm = this.fb.group({
      diagnosticos: ['', [Validators.required, Validators.minLength(5)]],
      recetas: ['']
    });

    this.scheduleForm = this.fb.group({
      fecha: ['', Validators.required],
      hora_reserva: ['09:00', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAppointments();
    this.loadMySchedules();
  }

  loadAppointments(): void {
    this.medicalService.getAppointments().subscribe({
      next: (data) => this.appointments.set(data),
      error: (e) => console.error(e)
    });
  }

  loadMySchedules(): void {
    const doctorId = this.authService.currentUser()?.id_especifico;
    if (doctorId) {
      this.medicalService.getDoctorSchedules(doctorId, false).subscribe({
        next: (data) => this.mySchedules.set(data),
        error: (e) => console.error(e)
      });
    }
  }

  filteredAppointments(): Appointment[] {
    const filter = this.statusFilter();
    if (filter === 'todos') return this.appointments();
    return this.appointments().filter(a => a.estado_cita === filter);
  }

  pendingAppointmentsCount(): number {
    return this.appointments().filter(a => a.estado_cita === 'confirmada' || a.estado_cita === 'pendiente').length;
  }

  finishedAppointmentsCount(): number {
    return this.appointments().filter(a => a.estado_cita === 'finalizada').length;
  }

  openConsultModal(cita: Appointment): void {
    this.selectedAppointment.set(cita);
    this.consultForm.patchValue({
      diagnosticos: cita.diagnosticos || '',
      recetas: cita.recetas || ''
    });
  }

  submitConsult(): void {
    const cita = this.selectedAppointment();
    if (!cita || this.consultForm.invalid) return;

    this.isSubmittingConsult.set(true);
    const { diagnosticos, recetas } = this.consultForm.value;

    this.medicalService.attendAppointment(cita.id_cita, diagnosticos, recetas).subscribe({
      next: () => {
        this.isSubmittingConsult.set(false);
        this.selectedAppointment.set(null);
        this.loadAppointments();
      },
      error: (err) => {
        this.isSubmittingConsult.set(false);
        alert(err.error?.message || 'Error al registrar consulta médica');
      }
    });
  }

  submitSchedule(): void {
    if (this.scheduleForm.invalid) return;
    const doctorId = this.authService.currentUser()?.id_especifico;
    if (!doctorId) return;

    this.isSubmittingSchedule.set(true);
    this.scheduleSuccessMsg.set(null);
    this.scheduleErrorMsg.set(null);

    const { fecha, hora_reserva } = this.scheduleForm.value;
    const formattedHora = hora_reserva.length === 5 ? `${hora_reserva}:00` : hora_reserva;

    this.medicalService.addDoctorSchedule(doctorId, fecha, formattedHora).subscribe({
      next: () => {
        this.isSubmittingSchedule.set(false);
        this.scheduleSuccessMsg.set('Franja horaria publicada exitosamente.');
        this.scheduleForm.reset({ fecha: '', hora_reserva: '09:00' });
        this.loadMySchedules();
      },
      error: (err) => {
        this.isSubmittingSchedule.set(false);
        this.scheduleErrorMsg.set(err.error?.message || 'Error al registrar horario');
      }
    });
  }
}
