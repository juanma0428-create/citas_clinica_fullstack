import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface Role {
  id_rol: number;
  nombre_rol: string;
}

export interface User {
  id_usuario: number;
  nombre_usuario: string;
  contrasenia: string;
  id_rol: number;
}

export interface Patient {
  id_cliente: number;
  nombre_cli: string;
  apellido_cli: string;
  nacimiento_cli: string;
  telefono_cli: string;
  id_usuario: number;
}

export interface Doctor {
  id_medico: number;
  nombre_med: string;
  apellido_med: string;
  id_especialidad: number;
  telefono_med: string;
  equipo_disponible: string;
  id_usuario: number;
}

export interface Administrator {
  id_administrador: number;
  nombre_adm: string;
  apellido_adm: string;
  id_usuario: number;
}

export interface Specialty {
  id_especialidad: number;
  nombre_especialidad: string;
}

export interface Room {
  id_sala: number;
  nombre_sala: string;
  id_especialidad: number;
}

export interface Equipment {
  id_equipo: number;
  nombre: string;
  id_especialidad: number;
  cantidad: number;
}

export interface Schedule {
  id_horario: number;
  fecha: string;
  hora_reserva: string;
  disponibilidad: number; // 1: disponible, 0: ocupado
  id_medico: number;
}

export interface Appointment {
  id_cita: number;
  id_medico: number;
  id_cliente: number;
  id_sala: number;
  id_horario: number;
  motivo_consulta: string;
  diagnosticos: string | null;
  recetas: string | null;
  estado_cita: 'pendiente' | 'confirmada' | 'cancelada' | 'finalizada';
}

// In-Memory dataset seeded with sys_citas.sql data
class SysCitasDataStore {
  roles: Role[] = [
    { id_rol: 1, nombre_rol: 'Paciente' },
    { id_rol: 2, nombre_rol: 'Medico' },
    { id_rol: 3, nombre_rol: 'Administrador' }
  ];

  users: User[] = [
    { id_usuario: 1, nombre_usuario: 'paciente_juan', contrasenia: 'clave123', id_rol: 1 },
    { id_usuario: 2, nombre_usuario: 'paciente_maria', contrasenia: 'clave123', id_rol: 1 },
    { id_usuario: 3, nombre_usuario: 'dr_carlos', contrasenia: 'clave123', id_rol: 2 },
    { id_usuario: 4, nombre_usuario: 'dra_ana', contrasenia: 'clave123', id_rol: 2 },
    { id_usuario: 5, nombre_usuario: 'admin_roberto', contrasenia: 'clave123', id_rol: 3 },
    { id_usuario: 6, nombre_usuario: 'admin_laura', contrasenia: 'clave123', id_rol: 3 }
  ];

  admins: Administrator[] = [
    { id_administrador: 1, nombre_adm: 'Roberto', apellido_adm: 'Sánchez', id_usuario: 5 },
    { id_administrador: 2, nombre_adm: 'Laura', apellido_adm: 'Gómez', id_usuario: 6 }
  ];

  specialties: Specialty[] = [
    { id_especialidad: 1, nombre_especialidad: 'Cardiología' },
    { id_especialidad: 2, nombre_especialidad: 'Pediatría' },
    { id_especialidad: 3, nombre_especialidad: 'Medicina General' },
    { id_especialidad: 4, nombre_especialidad: 'Dermatología' },
    { id_especialidad: 5, nombre_especialidad: 'Neurología' }
  ];

  doctors: Doctor[] = [
    { id_medico: 1, nombre_med: 'Carlos', apellido_med: 'López', id_especialidad: 1, telefono_med: '3214-5678', equipo_disponible: 'Estetoscopio, Tensiómetro', id_usuario: 3 },
    { id_medico: 2, nombre_med: 'Ana', apellido_med: 'Martínez', id_especialidad: 2, telefono_med: '5555-0202', equipo_disponible: 'Báscula pediátrica', id_usuario: 4 }
  ];

  patients: Patient[] = [
    { id_cliente: 1, nombre_cli: 'Juan Manuel', apellido_cli: 'Chica', nacimiento_cli: '1995-04-12', telefono_cli: '4123-5678', id_usuario: 1 },
    { id_cliente: 2, nombre_cli: 'María', apellido_cli: 'García', nacimiento_cli: '1990-11-20', telefono_cli: '5987-1234', id_usuario: 2 }
  ];

  rooms: Room[] = [
    { id_sala: 1, nombre_sala: 'Consultorio A1', id_especialidad: 1 },
    { id_sala: 2, nombre_sala: 'Consultorio B2', id_especialidad: 2 },
    { id_sala: 3, nombre_sala: 'Consultorio C3', id_especialidad: 3 }
  ];

  equipments: Equipment[] = [
    { id_equipo: 1, nombre: 'Monitor Cardíaco', id_especialidad: 1, cantidad: 2 },
    { id_equipo: 2, nombre: 'Camilla Pediátrica', id_especialidad: 2, cantidad: 1 },
    { id_equipo: 3, nombre: 'Electrocardiógrafo', id_especialidad: 1, cantidad: 1 },
    { id_equipo: 4, nombre: 'Dermatoscopio', id_especialidad: 4, cantidad: 3 }
  ];

  schedules: Schedule[] = [
    { id_horario: 1, fecha: '2026-08-25', hora_reserva: '09:00:00', disponibilidad: 0, id_medico: 1 },
    { id_horario: 2, fecha: '2026-08-25', hora_reserva: '10:00:00', disponibilidad: 1, id_medico: 1 },
    { id_horario: 3, fecha: '2026-08-26', hora_reserva: '14:00:00', disponibilidad: 0, id_medico: 2 },
    { id_horario: 4, fecha: '2026-08-26', hora_reserva: '15:00:00', disponibilidad: 1, id_medico: 2 },
    // Fechas dinámicas para pruebas actuales
    { id_horario: 5, fecha: '2026-09-08', hora_reserva: '09:00:00', disponibilidad: 1, id_medico: 1 },
    { id_horario: 6, fecha: '2026-09-08', hora_reserva: '11:00:00', disponibilidad: 1, id_medico: 1 },
    { id_horario: 7, fecha: '2026-09-08', hora_reserva: '14:00:00', disponibilidad: 1, id_medico: 2 },
    { id_horario: 8, fecha: '2026-09-09', hora_reserva: '10:00:00', disponibilidad: 1, id_medico: 2 },
    { id_horario: 9, fecha: '2026-09-10', hora_reserva: '16:00:00', disponibilidad: 1, id_medico: 1 }
  ];

  appointments: Appointment[] = [
    {
      id_cita: 1,
      id_medico: 1,
      id_cliente: 1,
      id_sala: 1,
      id_horario: 1,
      motivo_consulta: 'Chequeo de presión arterial de rutina',
      diagnosticos: 'Presión arterial ligeramente alta',
      recetas: 'Reducir consumo de sal, ejercicio moderado diario de 30 minutos',
      estado_cita: 'finalizada'
    },
    {
      id_cita: 2,
      id_medico: 2,
      id_cliente: 2,
      id_sala: 2,
      id_horario: 3,
      motivo_consulta: 'Control mensual del bebé',
      diagnosticos: 'Desarrollo normal, peso adecuado para edad gestacional',
      recetas: 'Vitaminas pediátricas A+D, continuar lactancia',
      estado_cita: 'confirmada'
    }
  ];
}

export const dbStore = new SysCitasDataStore();

let isMySqlConnected = false;
let pool: mysql.Pool | null = null;

export async function initDatabaseConnection() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_sys_citas',
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isMySqlConnected = true;
    console.log('✅ Conectado exitosamente a la base de datos MySQL (db_sys_citas).');
  } catch (err) {
    isMySqlConnected = false;
    console.warn('⚠️ No se pudo conectar a MySQL local. Usando motor de datos en memoria (sys_citas.sql seed pre-cargado).');
  }
}

export { isMySqlConnected, pool };
