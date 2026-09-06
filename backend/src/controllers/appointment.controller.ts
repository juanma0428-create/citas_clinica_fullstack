import { Response } from 'express';
import { dbStore, pool, isMySqlConnected } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { encryptSensitiveData, decryptSensitiveData } from '../utils/crypto.js';

export interface NotificationLog {
  id: number;
  tipo: 'EMAIL' | 'SMS' | 'APP';
  destinatario: string;
  mensaje: string;
  fecha: string;
}

export const notificationLogs: NotificationLog[] = [
  {
    id: 1,
    tipo: 'EMAIL',
    destinatario: 'juan.chica@email.com',
    mensaje: 'Su cita con Dr. Carlos López para el 2026-08-25 ha sido finalizada con éxito.',
    fecha: '2026-08-25 10:00'
  },
  {
    id: 2,
    tipo: 'SMS',
    destinatario: '+502 5987-1234',
    mensaje: 'Recordatorio: Su cita de Pediatría con Dra. Ana Martínez está confirmada.',
    fecha: '2026-08-26 13:00'
  }
];

function sendSimulationNotification(tipo: 'EMAIL' | 'SMS' | 'APP', destinatario: string, mensaje: string) {
  notificationLogs.unshift({
    id: notificationLogs.length + 1,
    tipo,
    destinatario,
    mensaje,
    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });
}

export async function getAppointments(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const { status, id_medico, id_cliente } = req.query;

    if (isMySqlConnected && pool) {
      let query = `
        SELECT 
          c.id_cita, c.motivo_consulta, c.diagnosticos, c.recetas, c.estado_cita,
          m.id_medico, m.nombre_med, m.apellido_med, m.telefono_med,
          esp.id_especialidad, esp.nombre_especialidad,
          cli.id_cliente, cli.nombre_cli, cli.apellido_cli, cli.telefono_cli, cli.nacimiento_cli,
          s.id_sala, s.nombre_sala,
          h.id_horario, h.fecha, h.hora_reserva
        FROM tb_citas c
        JOIN tb_medicos m ON c.id_medico = m.id_medico
        JOIN tb_especialidades esp ON m.id_especialidad = esp.id_especialidad
        JOIN tb_clientes cli ON c.id_cliente = cli.id_cliente
        JOIN tb_salas s ON c.id_sala = s.id_sala
        JOIN tb_horarios h ON c.id_horario = h.id_horario
        WHERE 1=1
      `;
      const params: any[] = [];

      if (user.id_rol === 1) {
        query += ' AND c.id_cliente = ?';
        params.push(user.id_especifico);
      } else if (user.id_rol === 2) {
        query += ' AND c.id_medico = ?';
        params.push(user.id_especifico);
      } else {
        if (id_cliente) {
          query += ' AND c.id_cliente = ?';
          params.push(Number(id_cliente));
        }
        if (id_medico) {
          query += ' AND c.id_medico = ?';
          params.push(Number(id_medico));
        }
      }

      if (status) {
        query += ' AND c.estado_cita = ?';
        params.push(status);
      }

      query += ' ORDER BY h.fecha DESC, h.hora_reserva DESC';
      const [rows]: any = await pool.query(query, params);
      const decryptedRows = rows.map((r: any) => ({
        ...r,
        diagnosticos: decryptSensitiveData(r.diagnosticos),
        recetas: decryptSensitiveData(r.recetas)
      }));
      return res.json({ success: true, appointments: decryptedRows });
    }

    // In-memory processing
    let list = dbStore.appointments.map(c => {
      const med = dbStore.doctors.find(m => m.id_medico === c.id_medico);
      const esp = med ? dbStore.specialties.find(e => e.id_especialidad === med.id_especialidad) : null;
      const cli = dbStore.patients.find(p => p.id_cliente === c.id_cliente);
      const s = dbStore.rooms.find(r => r.id_sala === c.id_sala);
      const h = dbStore.schedules.find(sc => sc.id_horario === c.id_horario);

      return {
        id_cita: c.id_cita,
        motivo_consulta: c.motivo_consulta,
        diagnosticos: decryptSensitiveData(c.diagnosticos),
        recetas: decryptSensitiveData(c.recetas),
        estado_cita: c.estado_cita,
        id_medico: c.id_medico,
        nombre_med: med?.nombre_med || '',
        apellido_med: med?.apellido_med || '',
        telefono_med: med?.telefono_med || '',
        id_especialidad: esp?.id_especialidad || 0,
        nombre_especialidad: esp?.nombre_especialidad || '',
        id_cliente: c.id_cliente,
        nombre_cli: cli?.nombre_cli || '',
        apellido_cli: cli?.apellido_cli || '',
        telefono_cli: cli?.telefono_cli || '',
        nacimiento_cli: cli?.nacimiento_cli || '',
        id_sala: c.id_sala,
        nombre_sala: s?.nombre_sala || '',
        id_horario: c.id_horario,
        fecha: h?.fecha || '',
        hora_reserva: h?.hora_reserva || ''
      };
    });

    if (user.id_rol === 1) {
      list = list.filter(a => a.id_cliente === user.id_especifico);
    } else if (user.id_rol === 2) {
      list = list.filter(a => a.id_medico === user.id_especifico);
    } else {
      if (id_cliente) list = list.filter(a => a.id_cliente === Number(id_cliente));
      if (id_medico) list = list.filter(a => a.id_medico === Number(id_medico));
    }

    if (status) {
      list = list.filter(a => a.estado_cita === status);
    }

    list.sort((a, b) => (b.fecha + b.hora_reserva).localeCompare(a.fecha + a.hora_reserva));
    return res.json({ success: true, appointments: list });
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function createAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    let { id_medico, id_cliente, id_sala, id_horario, motivo_consulta } = req.body;

    // Si es paciente, forzar que el cliente sea él mismo
    if (user.id_rol === 1) {
      id_cliente = user.id_especifico;
    }

    if (!id_medico || !id_cliente || !id_sala || !id_horario || !motivo_consulta) {
      return res.status(400).json({ success: false, message: 'Todos los campos de la cita son requeridos' });
    }

    if (isMySqlConnected && pool) {
      // 1. Validar disponibilidad de horario
      const [horarios]: any = await pool.query('SELECT * FROM tb_horarios WHERE id_horario = ? AND id_medico = ?', [id_horario, id_medico]);
      if (horarios.length === 0 || horarios[0].disponibilidad !== 1) {
        return res.status(400).json({ success: false, message: 'El horario seleccionado ya no se encuentra disponible' });
      }

      // 2. Validar conflicto de sala (evitar dos citas simultáneas en la misma sala)
      const [salaConflict]: any = await pool.query(
        'SELECT c.id_cita FROM tb_citas c JOIN tb_horarios h ON c.id_horario = h.id_horario WHERE c.id_sala = ? AND h.fecha = ? AND h.hora_reserva = ? AND c.estado_cita IN ("pendiente", "confirmada")',
        [id_sala, horarios[0].fecha, horarios[0].hora_reserva]
      );
      if (salaConflict.length > 0) {
        return res.status(400).json({ success: false, message: 'La sala de consulta seleccionada ya está ocupada en ese horario' });
      }

      // 3. Crear cita
      const [result]: any = await pool.query(
        'INSERT INTO tb_citas (id_medico, id_cliente, id_sala, id_horario, motivo_consulta, estado_cita) VALUES (?, ?, ?, ?, ?, "confirmada")',
        [id_medico, id_cliente, id_sala, id_horario, motivo_consulta]
      );

      // 4. Bloquear horario
      await pool.query('UPDATE tb_horarios SET disponibilidad = 0 WHERE id_horario = ?', [id_horario]);

      sendSimulationNotification('EMAIL', 'paciente@hospital.com', `Su cita #${result.insertId} ha sido confirmada exitosamente.`);
      sendSimulationNotification('SMS', '+502 4123-5678', `Cita #${result.insertId} confirmada en ${horarios[0].fecha} ${horarios[0].hora_reserva}`);

      return res.status(201).json({ success: true, message: 'Cita reservada y confirmada exitosamente', id_cita: result.insertId });
    }

    // In-memory validation
    const horario = dbStore.schedules.find(h => h.id_horario === Number(id_horario) && h.id_medico === Number(id_medico));
    if (!horario || horario.disponibilidad !== 1) {
      return res.status(400).json({ success: false, message: 'El horario seleccionado ya no está disponible' });
    }

    // Check room conflict
    const roomConflict = dbStore.appointments.some(a => {
      if (a.estado_cita === 'cancelada') return false;
      if (a.id_sala !== Number(id_sala)) return false;
      const h = dbStore.schedules.find(sc => sc.id_horario === a.id_horario);
      return h && h.fecha === horario.fecha && h.hora_reserva === horario.hora_reserva;
    });

    if (roomConflict) {
      return res.status(400).json({ success: false, message: 'La sala seleccionada está ocupada en ese mismo horario' });
    }

    // Reserve
    horario.disponibilidad = 0;
    const newId = dbStore.appointments.length > 0 ? Math.max(...dbStore.appointments.map(a => a.id_cita)) + 1 : 1;
    const newApp = {
      id_cita: newId,
      id_medico: Number(id_medico),
      id_cliente: Number(id_cliente),
      id_sala: Number(id_sala),
      id_horario: Number(id_horario),
      motivo_consulta,
      diagnosticos: null,
      recetas: null,
      estado_cita: 'confirmada' as const
    };
    dbStore.appointments.push(newApp);

    const med = dbStore.doctors.find(m => m.id_medico === Number(id_medico));
    sendSimulationNotification('EMAIL', 'paciente@hospital.com', `Cita #${newId} con Dr(a). ${med?.nombre_med || ''} ${med?.apellido_med || ''} confirmada para el ${horario.fecha} a las ${horario.hora_reserva}.`);
    sendSimulationNotification('SMS', '+502 4123-5678', `Hospital SysCitas: Cita #${newId} agendada para el ${horario.fecha} ${horario.hora_reserva}.`);

    return res.status(201).json({ success: true, message: 'Cita reservada y confirmada con éxito', id_cita: newId });
  } catch (error) {
    console.error('Error al crear cita:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function cancelAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const id_cita = Number(req.params.id);

    if (isMySqlConnected && pool) {
      const [citas]: any = await pool.query('SELECT * FROM tb_citas WHERE id_cita = ?', [id_cita]);
      if (citas.length === 0) {
        return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      }
      const cita = citas[0];
      if (user.id_rol === 1 && cita.id_cliente !== user.id_especifico) {
        return res.status(403).json({ success: false, message: 'No puedes cancelar una cita ajena' });
      }

      await pool.query('UPDATE tb_citas SET estado_cita = "cancelada" WHERE id_cita = ?', [id_cita]);
      await pool.query('UPDATE tb_horarios SET disponibilidad = 1 WHERE id_horario = ?', [cita.id_horario]);

      sendSimulationNotification('APP', 'Sistema', `La cita #${id_cita} fue cancelada. Horario liberado.`);
      return res.json({ success: true, message: 'Cita cancelada y horario liberado exitosamente' });
    }

    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    if (user.id_rol === 1 && cita.id_cliente !== user.id_especifico) {
      return res.status(403).json({ success: false, message: 'No autorizado para cancelar esta cita' });
    }

    cita.estado_cita = 'cancelada';
    const horario = dbStore.schedules.find(h => h.id_horario === cita.id_horario);
    if (horario) {
      horario.disponibilidad = 1;
    }

    sendSimulationNotification('EMAIL', 'paciente@hospital.com', `Su cita #${id_cita} ha sido cancelada satisfactoriamente.`);
    sendSimulationNotification('SMS', '+502 4123-5678', `Cita #${id_cita} cancelada. Horario liberado.`);

    return res.json({ success: true, message: 'Cita cancelada con éxito' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function rescheduleAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const id_cita = Number(req.params.id);
    const { nuevo_id_horario, nuevo_id_sala } = req.body;

    if (!nuevo_id_horario) {
      return res.status(400).json({ success: false, message: 'Debe indicar el nuevo horario' });
    }

    if (isMySqlConnected && pool) {
      const [citas]: any = await pool.query('SELECT * FROM tb_citas WHERE id_cita = ?', [id_cita]);
      if (citas.length === 0) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      const cita = citas[0];

      if (user.id_rol === 1 && cita.id_cliente !== user.id_especifico) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      const [horarios]: any = await pool.query('SELECT * FROM tb_horarios WHERE id_horario = ? AND disponibilidad = 1', [nuevo_id_horario]);
      if (horarios.length === 0) {
        return res.status(400).json({ success: false, message: 'El nuevo horario no está disponible' });
      }

      // Liberar horario anterior
      await pool.query('UPDATE tb_horarios SET disponibilidad = 1 WHERE id_horario = ?', [cita.id_horario]);
      // Ocupar nuevo horario
      await pool.query('UPDATE tb_horarios SET disponibilidad = 0 WHERE id_horario = ?', [nuevo_id_horario]);

      const salaActualizar = nuevo_id_sala || cita.id_sala;
      await pool.query(
        'UPDATE tb_citas SET id_horario = ?, id_sala = ?, estado_cita = "confirmada" WHERE id_cita = ?',
        [nuevo_id_horario, salaActualizar, id_cita]
      );

      sendSimulationNotification('EMAIL', 'paciente@hospital.com', `Su cita #${id_cita} fue reprogramada para el ${horarios[0].fecha} a las ${horarios[0].hora_reserva}.`);
      return res.json({ success: true, message: 'Cita reprogramada con éxito' });
    }

    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    if (user.id_rol === 1 && cita.id_cliente !== user.id_especifico) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const nuevoHorario = dbStore.schedules.find(h => h.id_horario === Number(nuevo_id_horario) && h.disponibilidad === 1);
    if (!nuevoHorario) {
      return res.status(400).json({ success: false, message: 'El horario seleccionado ya no está disponible' });
    }

    // Liberar anterior
    const horarioAntiguo = dbStore.schedules.find(h => h.id_horario === cita.id_horario);
    if (horarioAntiguo) horarioAntiguo.disponibilidad = 1;

    // Bloquear nuevo
    nuevoHorario.disponibilidad = 0;
    cita.id_horario = Number(nuevo_id_horario);
    if (nuevo_id_sala) cita.id_sala = Number(nuevo_id_sala);
    cita.estado_cita = 'confirmada';

    sendSimulationNotification('EMAIL', 'paciente@hospital.com', `Su cita #${id_cita} fue reprogramada para el ${nuevoHorario.fecha} a las ${nuevoHorario.hora_reserva}.`);
    sendSimulationNotification('SMS', '+502 4123-5678', `Cita #${id_cita} reprogramada: ${nuevoHorario.fecha} ${nuevoHorario.hora_reserva}.`);

    return res.json({ success: true, message: 'Cita reprogramada exitosamente' });
  } catch (error) {
    console.error('Error al reprogramar cita:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function attendAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const user = req.user!;
    const id_cita = Number(req.params.id);
    const { diagnosticos, recetas } = req.body;

    if (user.id_rol !== 2 && user.id_rol !== 3) {
      return res.status(403).json({ success: false, message: 'Solo médicos o administradores pueden atender y emitir diagnósticos' });
    }

    if (!diagnosticos) {
      return res.status(400).json({ success: false, message: 'El diagnóstico médico es obligatorio' });
    }

    const encryptedDiagnosticos = encryptSensitiveData(diagnosticos);
    const encryptedRecetas = encryptSensitiveData(recetas || '');

    if (isMySqlConnected && pool) {
      await pool.query(
        'UPDATE tb_citas SET diagnosticos = ?, recetas = ?, estado_cita = "finalizada" WHERE id_cita = ?',
        [encryptedDiagnosticos, encryptedRecetas, id_cita]
      );
      sendSimulationNotification('APP', 'Paciente', `Su consulta #${id_cita} ha finalizado. Puede ver su diagnóstico y receta en su Historial Médico.`);
      return res.json({ success: true, message: 'Consulta registrada y cita finalizada con éxito' });
    }

    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    cita.diagnosticos = encryptedDiagnosticos;
    cita.recetas = encryptedRecetas;
    cita.estado_cita = 'finalizada';

    sendSimulationNotification('APP', 'Paciente', `Consulta #${id_cita} finalizada. Recetas e indicaciones registradas.`);
    return res.json({ success: true, message: 'Consulta registrada y receta emitida exitosamente' });
  } catch (error) {
    console.error('Error al atender cita:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export function getNotifications(_req: AuthenticatedRequest, res: Response) {
  return res.json({ success: true, notifications: notificationLogs });
}
