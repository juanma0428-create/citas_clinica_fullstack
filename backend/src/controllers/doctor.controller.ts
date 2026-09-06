import { Request, Response } from 'express';
import { dbStore, pool, isMySqlConnected } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function getDoctors(req: Request, res: Response) {
  try {
    const { id_especialidad } = req.query;

    if (isMySqlConnected && pool) {
      let query = `
        SELECT 
          m.id_medico, m.nombre_med, m.apellido_med, m.telefono_med, m.equipo_disponible,
          esp.id_especialidad, esp.nombre_especialidad,
          u.nombre_usuario
        FROM tb_medicos m
        JOIN tb_especialidades esp ON m.id_especialidad = esp.id_especialidad
        JOIN tb_usuarios u ON m.id_usuario = u.id_usuario
        WHERE 1=1
      `;
      const params: any[] = [];
      if (id_especialidad) {
        query += ' AND m.id_especialidad = ?';
        params.push(Number(id_especialidad));
      }
      query += ' ORDER BY m.nombre_med ASC';
      const [rows] = await pool.query(query, params);
      return res.json({ success: true, doctors: rows });
    }

    let list = dbStore.doctors.map(m => {
      const esp = dbStore.specialties.find(e => e.id_especialidad === m.id_especialidad);
      const user = dbStore.users.find(u => u.id_usuario === m.id_usuario);
      return {
        id_medico: m.id_medico,
        nombre_med: m.nombre_med,
        apellido_med: m.apellido_med,
        telefono_med: m.telefono_med,
        equipo_disponible: m.equipo_disponible,
        id_especialidad: esp?.id_especialidad || 0,
        nombre_especialidad: esp?.nombre_especialidad || '',
        nombre_usuario: user?.nombre_usuario || ''
      };
    });

    if (id_especialidad) {
      list = list.filter(d => d.id_especialidad === Number(id_especialidad));
    }

    return res.json({ success: true, doctors: list });
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function getDoctorSchedules(req: Request, res: Response) {
  try {
    const id_medico = Number(req.params.id);
    const { solo_disponibles } = req.query;

    if (isMySqlConnected && pool) {
      let query = 'SELECT * FROM tb_horarios WHERE id_medico = ?';
      const params: any[] = [id_medico];
      if (solo_disponibles === 'true') {
        query += ' AND disponibilidad = 1';
      }
      query += ' ORDER BY fecha ASC, hora_reserva ASC';
      const [rows] = await pool.query(query, params);
      return res.json({ success: true, schedules: rows });
    }

    let list = dbStore.schedules.filter(s => s.id_medico === id_medico);
    if (solo_disponibles === 'true') {
      list = list.filter(s => s.disponibilidad === 1);
    }
    list.sort((a, b) => (a.fecha + a.hora_reserva).localeCompare(b.fecha + b.hora_reserva));

    return res.json({ success: true, schedules: list });
  } catch (error) {
    console.error('Error al obtener horarios del médico:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function addDoctorSchedule(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    let id_medico = Number(req.params.id);
    const { fecha, hora_reserva } = req.body;

    if (user.id_rol === 2) {
      id_medico = user.id_especifico!;
    }

    if (!fecha || !hora_reserva) {
      return res.status(400).json({ success: false, message: 'Fecha y hora de reserva son requeridas' });
    }

    if (isMySqlConnected && pool) {
      const [existing]: any = await pool.query(
        'SELECT * FROM tb_horarios WHERE id_medico = ? AND fecha = ? AND hora_reserva = ?',
        [id_medico, fecha, hora_reserva]
      );
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Ya existe un bloque para este médico en la misma fecha y hora' });
      }

      const [result]: any = await pool.query(
        'INSERT INTO tb_horarios (fecha, hora_reserva, disponibilidad, id_medico) VALUES (?, ?, 1, ?)',
        [fecha, hora_reserva, id_medico]
      );
      return res.status(201).json({ success: true, message: 'Horario agregado exitosamente', id_horario: result.insertId });
    }

    const exists = dbStore.schedules.some(s => s.id_medico === id_medico && s.fecha === fecha && s.hora_reserva === hora_reserva);
    if (exists) {
      return res.status(400).json({ success: false, message: 'Ya existe un horario para esta fecha y hora' });
    }

    const newId = dbStore.schedules.length > 0 ? Math.max(...dbStore.schedules.map(s => s.id_horario)) + 1 : 1;
    const newSchedule = {
      id_horario: newId,
      fecha,
      hora_reserva,
      disponibilidad: 1,
      id_medico
    };
    dbStore.schedules.push(newSchedule);

    return res.status(201).json({ success: true, message: 'Horario creado exitosamente', schedule: newSchedule });
  } catch (error) {
    console.error('Error al agregar horario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
