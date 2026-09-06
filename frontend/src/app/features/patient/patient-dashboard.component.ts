import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MedicalService } from '../../core/services/medical.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { 
  Appointment, 
  Specialty, 
  Doctor, 
  ScheduleSlot, 
  Room, 
  NotificationLog 
} from '../../core/models/medical.models';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, StatusBadgeComponent],
  template: `
    <div class="patient-page">
      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1>Hola, {{ authService.currentUser()?.nombre_completo }} 👋</h1>
          <p>Bienvenido a tu portal de salud. Gestiona tus citas médicas, revisa tus recetas y mantente al día con tu tratamiento.</p>
        </div>
        <div class="banner-action">
          <button class="btn btn-primary" (click)="activeTab.set('reservar')">
            <span>➕</span> Reservar Nueva Cita
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="patient-tabs">
        <button [class.active]="activeTab() === 'citas'" (click)="activeTab.set('citas')">
          📅 Mis Citas ({{ appointments().length }})
        </button>
        <button [class.active]="activeTab() === 'reservar'" (click)="activeTab.set('reservar')">
          ✨ Reservar Cita
        </button>
        <button [class.active]="activeTab() === 'historial'" (click)="activeTab.set('historial')">
          📋 Historial Médico & Recetas
        </button>
        <button [class.active]="activeTab() === 'notificaciones'" (click)="activeTab.set('notificaciones')">
          🔔 Recordatorios ({{ notifications().length }})
        </button>
      </div>

      <!-- TAB 1: MIS CITAS -->
      @if (activeTab() === 'citas') {
        <div class="tab-pane">
          <div class="section-header">
            <h2>Tus Citas Registradas</h2>
            <button class="btn btn-secondary btn-sm" (click)="loadData()">🔄 Actualizar</button>
          </div>

          @if (appointments().length === 0) {
            <div class="empty-state card">
              <span class="empty-icon">🏥</span>
              <h3>No tienes citas médicas agendadas</h3>
              <p>Puedes reservar una consulta con nuestros especialistas de forma rápida y sencilla.</p>
              <button class="btn btn-primary" (click)="activeTab.set('reservar')">Reservar Cita Ahora</button>
            </div>
          } @else {
            <div class="appointments-grid">
              @for (cita of appointments(); track cita.id_cita) {
                <div class="appointment-card card" [class.cancelled]="cita.estado_cita === 'cancelada'">
                  <div class="app-header">
                    <span class="app-specialty">{{ cita.nombre_especialidad }}</span>
                    <app-status-badge [status]="cita.estado_cita"></app-status-badge>
                  </div>

                  <div class="doctor-info">
                    <div class="doc-avatar">🩺</div>
                    <div>
                      <h4 class="doc-name">Dr(a). {{ cita.nombre_med }} {{ cita.apellido_med }}</h4>
                      <p class="room-tag">📍 {{ cita.nombre_sala }}</p>
                    </div>
                  </div>

                  <div class="date-time-box">
                    <div class="dt-item">
                      <span class="dt-label">Fecha</span>
                      <span class="dt-val">{{ cita.fecha }}</span>
                    </div>
                    <div class="dt-item">
                      <span class="dt-label">Hora</span>
                      <span class="dt-val">{{ cita.hora_reserva }}</span>
                    </div>
                  </div>

                  <div class="motive-box">
                    <strong>Motivo:</strong> {{ cita.motivo_consulta }}
                  </div>

                  @if (cita.estado_cita === 'finalizada' && cita.diagnosticos) {
                    <div class="consult-preview">
                      <p><strong>Diagnóstico:</strong> {{ cita.diagnosticos }}</p>
                    </div>
                  }

                  <!-- Actions -->
                  @if (cita.estado_cita === 'confirmada' || cita.estado_cita === 'pendiente') {
                    <div class="app-actions">
                      <button class="btn btn-secondary btn-sm" (click)="openReschedule(cita)">
                        🔄 Reprogramar
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="cancelAppointment(cita.id_cita)">
                        ❌ Cancelar
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 2: RESERVAR CITA (WIZARD) -->
      @if (activeTab() === 'reservar') {
        <div class="tab-pane">
          <div class="wizard-container card">
            <div class="wizard-header">
              <h2>Reservar Cita Médica</h2>
              <p>Selecciona la especialidad, el profesional médico y tu horario de preferencia.</p>
            </div>

            @if (bookingSuccessMessage()) {
              <div class="alert alert-success">
                <span>🎉</span>
                <div>
                  <h4>¡Cita Reservada Exitosamente!</h4>
                  <p>{{ bookingSuccessMessage() }}</p>
                  <button class="btn btn-secondary btn-sm" style="margin-top: 0.5rem" (click)="finishBooking()">Ver Mis Citas</button>
                </div>
              </div>
            }

            <form [formGroup]="bookForm" (ngSubmit)="submitBooking()">
              <!-- Step 1: Specialty -->
              <div class="step-card">
                <label class="step-title">1. Selecciona Especialidad Médica</label>
                <div class="specialty-chips">
                  @for (esp of specialties(); track esp.id_especialidad) {
                    <button 
                      type="button" 
                      class="chip-btn" 
                      [class.selected]="bookForm.get('id_especialidad')?.value === esp.id_especialidad"
                      (click)="onSelectSpecialty(esp.id_especialidad)"
                    >
                      <span class="chip-icon">⚕️</span>
                      <span>{{ esp.nombre_especialidad }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Step 2: Doctor -->
              @if (bookForm.get('id_especialidad')?.value) {
                <div class="step-card">
                  <label class="step-title">2. Selecciona al Médico Especialista</label>
                  <div class="doctors-list">
                    @for (doc of filteredDoctors(); track doc.id_medico) {
                      <div 
                        class="doctor-select-card"
                        [class.selected]="bookForm.get('id_medico')?.value === doc.id_medico"
                        (click)="onSelectDoctor(doc.id_medico)"
                      >
                        <div class="doc-icon">👨‍⚕️</div>
                        <div class="doc-details">
                          <h4>Dr(a). {{ doc.nombre_med }} {{ doc.apellido_med }}</h4>
                          <span class="doc-spec">{{ doc.nombre_especialidad }}</span>
                          <span class="doc-equip">Equipamiento: {{ doc.equipo_disponible || 'Estándar clínico' }}</span>
                        </div>
                      </div>
                    } @empty {
                      <p class="no-data">No hay médicos registrados para esta especialidad.</p>
                    }
                  </div>
                </div>
              }

              <!-- Step 3: Available Schedules & Room -->
              @if (bookForm.get('id_medico')?.value) {
                <div class="step-card">
                  <label class="step-title">3. Horarios y Consultorios Disponibles</label>
                  @if (loadingSchedules()) {
                    <p>Cargando horarios disponibles en tiempo real...</p>
                  } @else {
                    @if (availableSchedules().length === 0) {
                      <p class="no-data">No hay horarios libres para este médico en este momento.</p>
                    } @else {
                      <div class="schedules-grid">
                        @for (slot of availableSchedules(); track slot.id_horario) {
                          <button 
                            type="button" 
                            class="schedule-slot"
                            [class.selected]="bookForm.get('id_horario')?.value === slot.id_horario"
                            (click)="bookForm.patchValue({ id_horario: slot.id_horario })"
                          >
                            <span class="slot-date">{{ slot.fecha }}</span>
                            <span class="slot-time">{{ slot.hora_reserva }}</span>
                          </button>
                        }
                      </div>
                    }

                    <div class="form-group" style="margin-top: 1.25rem;">
                      <label class="form-label">Consultorio / Sala Asignada:</label>
                      <select class="form-control" formControlName="id_sala">
                        <option [ngValue]="null" disabled>Selecciona una sala</option>
                        @for (room of rooms(); track room.id_sala) {
                          <option [value]="room.id_sala">{{ room.nombre_sala }} ({{ room.nombre_especialidad }})</option>
                        }
                      </select>
                    </div>
                  }
                </div>
              }

              <!-- Step 4: Motive & Submit -->
              @if (bookForm.get('id_horario')?.value) {
                <div class="step-card">
                  <label class="step-title">4. Motivo de la Consulta</label>
                  <div class="form-group">
                    <textarea 
                      class="form-control" 
                      rows="3" 
                      formControlName="motivo_consulta" 
                      placeholder="Describe brevemente los síntomas, dolor o motivo de tu cita médica..."
                    ></textarea>
                  </div>

                  @if (bookingError()) {
                    <div class="alert alert-error">
                      <span>⚠️</span> {{ bookingError() }}
                    </div>
                  }

                  <button 
                    type="submit" 
                    class="btn btn-primary" 
                    [disabled]="bookForm.invalid || isSubmittingBooking()"
                  >
                    @if (isSubmittingBooking()) {
                      <span>Procesando reserva...</span>
                    } @else {
                      <span>✅ Confirmar Reserva de Cita</span>
                    }
                  </button>
                </div>
              }
            </form>
          </div>
        </div>
      }

      <!-- TAB 3: HISTORIAL MÉDICO & RECETAS -->
      @if (activeTab() === 'historial') {
        <div class="tab-pane">
          <div class="section-header">
            <div>
              <h2>Expediente Clínico & Recetas</h2>
              <p>Historial completo de consultas previas, diagnósticos médicos e indicaciones farmacológicas.</p>
            </div>
            <button class="btn btn-secondary btn-sm" (click)="printHistory()">🖨️ Imprimir Resumen</button>
          </div>

          @if (completedAppointments().length === 0) {
            <div class="empty-state card">
              <span class="empty-icon">📁</span>
              <h3>Sin consultas finalizadas aún</h3>
              <p>Una vez que el médico te atienda en consulta, aquí podrás revisar todos tus diagnósticos y recetas médicas emitidas.</p>
            </div>
          } @else {
            <div class="history-timeline">
              @for (h of completedAppointments(); track h.id_cita) {
                <div class="history-card card">
                  <div class="history-header">
                    <div>
                      <span class="history-date">📅 {{ h.fecha }} — {{ h.hora_reserva }}</span>
                      <h3 class="history-title">Consulta de {{ h.nombre_especialidad }}</h3>
                      <p class="history-doc">Atendido por: <strong>Dr(a). {{ h.nombre_med }} {{ h.apellido_med }}</strong> ({{ h.nombre_sala }})</p>
                    </div>
                    <span class="badge badge-finalizada">Consulta Finalizada</span>
                  </div>

                  <div class="history-body">
                    <div class="history-section">
                      <h4>Motivo Registrado:</h4>
                      <p>{{ h.motivo_consulta }}</p>
                    </div>

                    <div class="history-section highlight-diag">
                      <h4>🩺 Diagnóstico Médico:</h4>
                      <p>{{ h.diagnosticos || 'Sin observaciones registradas' }}</p>
                    </div>

                    <div class="history-section highlight-presc">
                      <h4>💊 Receta Médica & Indicaciones:</h4>
                      <p>{{ h.recetas || 'No requiere medicación farmacológica' }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 4: NOTIFICACIONES & RECORDATORIOS -->
      @if (activeTab() === 'notificaciones') {
        <div class="tab-pane">
          <div class="section-header">
            <div>
              <h2>Centro de Recordatorios y Notificaciones</h2>
              <p>Historial de avisos generados automáticamente para tus citas (vía Correo Electrónico, SMS y Aplicación).</p>
            </div>
          </div>

          <div class="notifications-list card">
            @for (item of notifications(); track item.id) {
              <div class="notif-row">
                <div class="notif-badge-col">
                  <span class="channel-badge" [ngClass]="item.tipo.toLowerCase()">{{ item.tipo }}</span>
                </div>
                <div class="notif-detail-col">
                  <p class="notif-msg">{{ item.mensaje }}</p>
                  <span class="notif-dest">Destinatario: {{ item.destinatario }} &bull; {{ item.fecha }}</span>
                </div>
                <div class="notif-status-col">
                  <span class="badge badge-confirmada">Entregado</span>
                </div>
              </div>
            } @empty {
              <p class="no-data">No hay notificaciones registradas.</p>
            }
          </div>
        </div>
      }

      <!-- MODAL DE REPROGRAMAR CITA -->
      @if (rescheduleTarget()) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <div class="modal-header">
              <h3>Reprogramar Cita #{{ rescheduleTarget()?.id_cita }}</h3>
              <p>Dr(a). {{ rescheduleTarget()?.nombre_med }} {{ rescheduleTarget()?.apellido_med }} ({{ rescheduleTarget()?.nombre_especialidad }})</p>
            </div>

            <div class="modal-body">
              <label class="form-label">Selecciona el nuevo horario disponible:</label>
              @if (loadingRescheduleSlots()) {
                <p>Cargando horarios libres...</p>
              } @else {
                <div class="schedules-grid">
                  @for (slot of rescheduleSlots(); track slot.id_horario) {
                    <button 
                      type="button" 
                      class="schedule-slot"
                      [class.selected]="selectedNewScheduleId() === slot.id_horario"
                      (click)="selectedNewScheduleId.set(slot.id_horario)"
                    >
                      <span class="slot-date">{{ slot.fecha }}</span>
                      <span class="slot-time">{{ slot.hora_reserva }}</span>
                    </button>
                  } @empty {
                    <p class="no-data">No hay otros horarios disponibles para este médico.</p>
                  }
                </div>
              }
            </div>

            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
              <button class="btn btn-secondary" (click)="rescheduleTarget.set(null)">Cancelar</button>
              <button 
                class="btn btn-primary" 
                [disabled]="!selectedNewScheduleId() || isSubmittingReschedule()"
                (click)="confirmReschedule()"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .patient-page {
      max-width: 1300px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .welcome-banner {
      background: linear-gradient(135deg, #0f172a 0%, #134e4a 100%);
      color: #ffffff;
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
    }

    .welcome-text h1 {
      color: #ffffff;
      font-size: 1.75rem;
      margin-bottom: 0.35rem;
    }

    .welcome-text p {
      color: #cbd5e1;
      font-size: 0.95rem;
      max-width: 650px;
    }

    .patient-tabs {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }

    .patient-tabs button {
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

    .patient-tabs button.active {
      background: #0d9488;
      color: #ffffff;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    /* Appointments Cards Grid */
    .appointments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 1.5rem;
    }

    .appointment-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
    }

    .appointment-card.cancelled {
      opacity: 0.65;
      background: #f8fafc;
    }

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .app-specialty {
      font-size: 0.8rem;
      font-weight: 700;
      color: #0d9488;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .doctor-info {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .doc-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }

    .doc-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
    }

    .room-tag {
      font-size: 0.8rem;
      color: #64748b;
    }

    .date-time-box {
      display: flex;
      background: #f8fafc;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      gap: 1.5rem;
    }

    .dt-item {
      display: flex;
      flex-direction: column;
    }

    .dt-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #94a3b8;
      font-weight: 700;
    }

    .dt-val {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }

    .motive-box {
      font-size: 0.875rem;
      color: #475569;
      background: #f1f5f9;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
    }

    .app-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    /* Wizard Booking */
    .wizard-container {
      max-width: 780px;
      margin: 0 auto;
    }

    .step-card {
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px dashed #e2e8f0;
    }

    .step-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      display: block;
      margin-bottom: 0.85rem;
    }

    .specialty-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .chip-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.65rem 1.15rem;
      font-weight: 600;
      color: #334155;
      transition: all 0.15s ease;
    }

    .chip-btn:hover {
      border-color: #0d9488;
      background: #f0fdfa;
    }

    .chip-btn.selected {
      border-color: #0d9488;
      background: #0d9488;
      color: #ffffff;
    }

    .doctors-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .doctor-select-card {
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .doctor-select-card:hover {
      border-color: #0284c7;
      background: #f0f9ff;
    }

    .doctor-select-card.selected {
      border-color: #0284c7;
      background: #e0f2fe;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
    }

    .doc-icon {
      font-size: 2rem;
    }

    .doc-details h4 {
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }

    .doc-spec {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0284c7;
      display: block;
    }

    .doc-equip {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }

    .schedules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.75rem;
    }

    .schedule-slot {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      padding: 0.65rem 0.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      transition: all 0.15s ease;
    }

    .schedule-slot:hover {
      border-color: #0d9488;
      background: #f0fdfa;
    }

    .schedule-slot.selected {
      background: #0d9488;
      border-color: #0d9488;
      color: #ffffff;
    }

    .schedule-slot.selected .slot-date,
    .schedule-slot.selected .slot-time {
      color: #ffffff;
    }

    .slot-date {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 600;
    }

    .slot-time {
      font-size: 0.95rem;
      font-weight: 800;
      color: #0f172a;
    }

    /* History */
    .history-timeline {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .history-card {
      border-left: 4px solid #0d9488;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .history-date {
      font-size: 0.8rem;
      font-weight: 700;
      color: #0d9488;
    }

    .history-title {
      font-size: 1.2rem;
      margin: 0.2rem 0;
    }

    .history-doc {
      font-size: 0.85rem;
      color: #64748b;
    }

    .history-body {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .history-section h4 {
      font-size: 0.85rem;
      margin-bottom: 0.2rem;
    }

    .highlight-diag {
      background: #f0fdf4;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #dcfce7;
    }

    .highlight-presc {
      background: #f0f9ff;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #e0f2fe;
    }

    /* Notifications List */
    .notif-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .channel-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .channel-badge.email { background: #e0f2fe; color: #0284c7; }
    .channel-badge.sms { background: #dcfce7; color: #16a34a; }
    .channel-badge.app { background: #fef3c7; color: #d97706; }

    .notif-detail-col {
      flex: 1;
    }

    .notif-msg {
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
    }

    .notif-dest {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.75rem;
    }

    @media (max-width: 768px) {
      .welcome-banner {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      .doctors-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PatientDashboardComponent implements OnInit {
  activeTab = signal<'citas' | 'reservar' | 'historial' | 'notificaciones'>('citas');

  appointments = signal<Appointment[]>([]);
  specialties = signal<Specialty[]>([]);
  doctors = signal<Doctor[]>([]);
  rooms = signal<Room[]>([]);
  availableSchedules = signal<ScheduleSlot[]>([]);
  notifications = signal<NotificationLog[]>([]);

  filteredDoctors = signal<Doctor[]>([]);
  loadingSchedules = signal(false);

  bookForm: FormGroup;
  isSubmittingBooking = signal(false);
  bookingSuccessMessage = signal<string | null>(null);
  bookingError = signal<string | null>(null);

  // Reprogramar Modal State
  rescheduleTarget = signal<Appointment | null>(null);
  rescheduleSlots = signal<ScheduleSlot[]>([]);
  loadingRescheduleSlots = signal(false);
  selectedNewScheduleId = signal<number | null>(null);
  isSubmittingReschedule = signal(false);

  constructor(
    public authService: AuthService,
    private medicalService: MedicalService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.bookForm = this.fb.group({
      id_especialidad: [null, Validators.required],
      id_medico: [null, Validators.required],
      id_horario: [null, Validators.required],
      id_sala: [null, Validators.required],
      motivo_consulta: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  ngOnInit(): void {
    // Si viene de URL /paciente/reservar o /paciente/historial
    this.route.url.subscribe(segments => {
      const path = segments[0]?.path;
      if (path === 'reservar') this.activeTab.set('reservar');
      if (path === 'historial') this.activeTab.set('historial');
    });

    this.loadData();
  }

  loadData(): void {
    this.medicalService.getAppointments().subscribe({
      next: (data) => this.appointments.set(data),
      error: (e) => console.error(e)
    });

    this.medicalService.getSpecialties().subscribe({
      next: (data) => this.specialties.set(data),
      error: (e) => console.error(e)
    });

    this.medicalService.getDoctors().subscribe({
      next: (data) => {
        this.doctors.set(data);
        this.filteredDoctors.set(data);
      },
      error: (e) => console.error(e)
    });

    this.medicalService.getRooms().subscribe({
      next: (data) => this.rooms.set(data),
      error: (e) => console.error(e)
    });

    this.medicalService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: (e) => console.error(e)
    });
  }

  completedAppointments(): Appointment[] {
    return this.appointments().filter(a => a.estado_cita === 'finalizada');
  }

  onSelectSpecialty(id_especialidad: number): void {
    this.bookForm.patchValue({
      id_especialidad,
      id_medico: null,
      id_horario: null,
      id_sala: null
    });
    const filtered = this.doctors().filter(d => d.id_especialidad === id_especialidad);
    this.filteredDoctors.set(filtered);

    // Seleccionar automáticamente una sala de la misma especialidad si existe
    const matchingRoom = this.rooms().find(r => r.id_especialidad === id_especialidad);
    if (matchingRoom) {
      this.bookForm.patchValue({ id_sala: matchingRoom.id_sala });
    }
  }

  onSelectDoctor(id_medico: number): void {
    this.bookForm.patchValue({ id_medico, id_horario: null });
    this.loadingSchedules.set(true);
    this.medicalService.getDoctorSchedules(id_medico, true).subscribe({
      next: (slots) => {
        this.availableSchedules.set(slots);
        this.loadingSchedules.set(false);
      },
      error: () => this.loadingSchedules.set(false)
    });
  }

  submitBooking(): void {
    if (this.bookForm.invalid) return;
    this.isSubmittingBooking.set(true);
    this.bookingError.set(null);

    const { id_medico, id_sala, id_horario, motivo_consulta } = this.bookForm.value;

    this.medicalService.createAppointment({
      id_medico: Number(id_medico),
      id_sala: Number(id_sala),
      id_horario: Number(id_horario),
      motivo_consulta
    }).subscribe({
      next: (res) => {
        this.isSubmittingBooking.set(false);
        this.bookingSuccessMessage.set(res.message);
        this.loadData();
      },
      error: (err) => {
        this.isSubmittingBooking.set(false);
        this.bookingError.set(err.error?.message || 'Error al procesar reserva de cita');
      }
    });
  }

  finishBooking(): void {
    this.bookingSuccessMessage.set(null);
    this.bookForm.reset();
    this.activeTab.set('citas');
  }

  cancelAppointment(id_cita: number): void {
    if (confirm('¿Estás seguro de cancelar esta cita médica? El horario volverá a quedar disponible.')) {
      this.medicalService.cancelAppointment(id_cita).subscribe({
        next: () => {
          this.loadData();
        },
        error: (e) => alert(e.error?.message || 'Error al cancelar cita')
      });
    }
  }

  openReschedule(cita: Appointment): void {
    this.rescheduleTarget.set(cita);
    this.selectedNewScheduleId.set(null);
    this.loadingRescheduleSlots.set(true);

    this.medicalService.getDoctorSchedules(cita.id_medico, true).subscribe({
      next: (slots) => {
        this.rescheduleSlots.set(slots);
        this.loadingRescheduleSlots.set(false);
      },
      error: () => this.loadingRescheduleSlots.set(false)
    });
  }

  confirmReschedule(): void {
    const cita = this.rescheduleTarget();
    const newSlotId = this.selectedNewScheduleId();
    if (!cita || !newSlotId) return;

    this.isSubmittingReschedule.set(true);
    this.medicalService.rescheduleAppointment(cita.id_cita, newSlotId).subscribe({
      next: () => {
        this.isSubmittingReschedule.set(false);
        this.rescheduleTarget.set(null);
        this.loadData();
      },
      error: (e) => {
        this.isSubmittingReschedule.set(false);
        alert(e.error?.message || 'Error al reprogramar cita');
      }
    });
  }

  printHistory(): void {
    window.print();
  }
}
