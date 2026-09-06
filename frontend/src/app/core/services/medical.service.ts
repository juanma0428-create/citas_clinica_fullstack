import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  Appointment, 
  Doctor, 
  Specialty, 
  Room, 
  Equipment, 
  ScheduleSlot, 
  DashboardStats, 
  UserSummary,
  NotificationLog 
} from '../models/medical.models';

@Injectable({
  providedIn: 'root'
})
export class MedicalService {
  private readonly BASE_URL = '/api';

  constructor(private http: HttpClient) {}

  // Citas
  getAppointments(filters?: { status?: string; id_medico?: number; id_cliente?: number }): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.id_medico) params = params.set('id_medico', filters.id_medico.toString());
    if (filters?.id_cliente) params = params.set('id_cliente', filters.id_cliente.toString());

    return this.http.get<{ success: boolean; appointments: Appointment[] }>(`${this.BASE_URL}/citas`, { params }).pipe(
      map(res => res.appointments)
    );
  }

  createAppointment(data: {
    id_medico: number;
    id_cliente?: number;
    id_sala: number;
    id_horario: number;
    motivo_consulta: string;
  }): Observable<{ success: boolean; message: string; id_cita?: number }> {
    return this.http.post<{ success: boolean; message: string; id_cita?: number }>(`${this.BASE_URL}/citas`, data);
  }

  cancelAppointment(id_cita: number): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.BASE_URL}/citas/${id_cita}/cancelar`, {});
  }

  rescheduleAppointment(id_cita: number, nuevo_id_horario: number, nuevo_id_sala?: number): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.BASE_URL}/citas/${id_cita}/reprogramar`, {
      nuevo_id_horario,
      nuevo_id_sala
    });
  }

  attendAppointment(id_cita: number, diagnosticos: string, recetas: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.BASE_URL}/citas/${id_cita}/atender`, {
      diagnosticos,
      recetas
    });
  }

  getNotifications(): Observable<NotificationLog[]> {
    return this.http.get<{ success: boolean; notifications: NotificationLog[] }>(`${this.BASE_URL}/notificaciones`).pipe(
      map(res => res.notifications)
    );
  }

  // Médicos y Horarios
  getDoctors(id_especialidad?: number): Observable<Doctor[]> {
    let params = new HttpParams();
    if (id_especialidad) params = params.set('id_especialidad', id_especialidad.toString());

    return this.http.get<{ success: boolean; doctors: Doctor[] }>(`${this.BASE_URL}/medicos`, { params }).pipe(
      map(res => res.doctors)
    );
  }

  getDoctorSchedules(id_medico: number, solo_disponibles = true): Observable<ScheduleSlot[]> {
    let params = new HttpParams().set('solo_disponibles', solo_disponibles.toString());
    return this.http.get<{ success: boolean; schedules: ScheduleSlot[] }>(`${this.BASE_URL}/medicos/${id_medico}/horarios`, { params }).pipe(
      map(res => res.schedules)
    );
  }

  addDoctorSchedule(id_medico: number, fecha: string, hora_reserva: string): Observable<any> {
    return this.http.post(`${this.BASE_URL}/medicos/${id_medico}/horarios`, { fecha, hora_reserva });
  }

  // Recursos
  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<{ success: boolean; specialties: Specialty[] }>(`${this.BASE_URL}/especialidades`).pipe(
      map(res => res.specialties)
    );
  }

  getRooms(id_especialidad?: number): Observable<Room[]> {
    let params = new HttpParams();
    if (id_especialidad) params = params.set('id_especialidad', id_especialidad.toString());

    return this.http.get<{ success: boolean; rooms: Room[] }>(`${this.BASE_URL}/salas`, { params }).pipe(
      map(res => res.rooms)
    );
  }

  createRoom(nombre_sala: string, id_especialidad: number): Observable<any> {
    return this.http.post(`${this.BASE_URL}/salas`, { nombre_sala, id_especialidad });
  }

  getEquipment(): Observable<Equipment[]> {
    return this.http.get<{ success: boolean; equipment: Equipment[] }>(`${this.BASE_URL}/equipos`).pipe(
      map(res => res.equipment)
    );
  }

  createEquipment(nombre: string, id_especialidad: number, cantidad: number): Observable<any> {
    return this.http.post(`${this.BASE_URL}/equipos`, { nombre, id_especialidad, cantidad });
  }

  // Admin
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<{ success: boolean; stats: DashboardStats }>(`${this.BASE_URL}/admin/dashboard`).pipe(
      map(res => res.stats)
    );
  }

  getUsers(): Observable<UserSummary[]> {
    return this.http.get<{ success: boolean; users: UserSummary[] }>(`${this.BASE_URL}/admin/usuarios`).pipe(
      map(res => res.users)
    );
  }

  createUser(data: {
    id_rol: number;
    nombre_usuario: string;
    contrasenia: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    nacimiento_cli?: string;
    id_especialidad?: number;
    equipo_disponible?: string;
  }): Observable<any> {
    return this.http.post(`${this.BASE_URL}/admin/usuarios`, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.BASE_URL}/admin/usuarios/${id}`, data);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/admin/usuarios/${id}`);
  }

  approveAppointment(id_cita: number): Observable<any> {
    return this.http.put(`${this.BASE_URL}/admin/citas/${id_cita}/aprobar`, {});
  }

  rejectAppointment(id_cita: number): Observable<any> {
    return this.http.put(`${this.BASE_URL}/admin/citas/${id_cita}/rechazar`, {});
  }

  modifyAppointment(id_cita: number, data: {
    id_medico?: number;
    id_horario?: number;
    id_sala?: number;
    motivo_consulta?: string;
    estado_cita?: string;
  }): Observable<any> {
    return this.http.put(`${this.BASE_URL}/admin/citas/${id_cita}/modificar`, data);
  }
}
