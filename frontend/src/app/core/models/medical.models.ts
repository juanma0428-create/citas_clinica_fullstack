export interface AuthUser {
  id_usuario: number;
  nombre_usuario: string;
  id_rol: number;
  rol_nombre: string;
  id_especifico: number;
  nombre_completo: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

export interface Specialty {
  id_especialidad: number;
  nombre_especialidad: string;
}

export interface Room {
  id_sala: number;
  nombre_sala: string;
  id_especialidad: number;
  nombre_especialidad?: string;
}

export interface Equipment {
  id_equipo: number;
  nombre: string;
  id_especialidad: number;
  cantidad: number;
  nombre_especialidad?: string;
}

export interface ScheduleSlot {
  id_horario: number;
  fecha: string;
  hora_reserva: string;
  disponibilidad: number; // 1 = disponible, 0 = ocupado
  id_medico: number;
}

export interface Doctor {
  id_medico: number;
  nombre_med: string;
  apellido_med: string;
  telefono_med: string;
  equipo_disponible: string;
  id_especialidad: number;
  nombre_especialidad?: string;
  nombre_usuario?: string;
}

export interface Appointment {
  id_cita: number;
  motivo_consulta: string;
  diagnosticos: string | null;
  recetas: string | null;
  estado_cita: 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';
  id_medico: number;
  nombre_med: string;
  apellido_med: string;
  telefono_med: string;
  id_especialidad: number;
  nombre_especialidad: string;
  id_cliente: number;
  nombre_cli: string;
  apellido_cli: string;
  telefono_cli: string;
  nacimiento_cli: string;
  id_sala: number;
  nombre_sala: string;
  id_horario: number;
  fecha: string;
  hora_reserva: string;
}

export interface NotificationLog {
  id: number;
  tipo: 'EMAIL' | 'SMS' | 'APP';
  destinatario: string;
  mensaje: string;
  fecha: string;
}

export interface DashboardStats {
  totalCitas: number;
  totalMedicos: number;
  totalPacientes: number;
  totalSalas: number;
  citasPorEstado: { estado_cita: string; total: number }[];
  citasPorEspecialidad: { nombre_especialidad: string; total: number }[];
}

export interface UserSummary {
  id_usuario: number;
  nombre_usuario: string;
  id_rol: number;
  nombre_rol: string;
  nombre?: string;
  apellido?: string;
  nombre_completo: string;
  telefono: string;
  nacimiento_cli?: string;
  id_especialidad?: number;
  nombre_especialidad?: string;
  equipo_disponible?: string;
}
