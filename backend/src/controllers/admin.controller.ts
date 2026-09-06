import { Request, Response } from 'express';
import { dbStore, pool, isMySqlConnected } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function getDashboardStats(_req: AuthenticatedRequest, res: Response) {
  try {
    if (isMySqlConnected && pool) {
      const [totalCitas]: any = await pool.query('SELECT COUNT(*) as count FROM tb_citas');
      const [totalMedicos]: any = await pool.query('SELECT COUNT(*) as count FROM tb_medicos');
      const [totalPacientes]: any = await pool.query('SELECT COUNT(*) as count FROM tb_clientes');
      const [totalSalas]: any = await pool.query('SELECT COUNT(*) as count FROM tb_salas');

      const [citasPorEstado]: any = await pool.query('SELECT estado_cita, COUNT(*) as total FROM tb_citas GROUP BY estado_cita');
      const [citasPorEspecialidad]: any = await pool.query(`
        SELECT esp.nombre_especialidad, COUNT(c.id_cita) as total
        FROM tb_especialidades esp
        LEFT JOIN tb_medicos m ON esp.id_especialidad = m.id_especialidad
        LEFT JOIN tb_citas c ON m.id_medico = c.id_medico
        GROUP BY esp.id_especialidad, esp.nombre_especialidad
      `);

      return res.json({
        success: true,
        stats: {
          totalCitas: totalCitas[0].count,
          totalMedicos: totalMedicos[0].count,
          totalPacientes: totalPacientes[0].count,
          totalSalas: totalSalas[0].count,
          citasPorEstado,
          citasPorEspecialidad
        }
      });
    }

    const totalCitas = dbStore.appointments.length;
    const totalMedicos = dbStore.doctors.length;
    const totalPacientes = dbStore.patients.length;
    const totalSalas = dbStore.rooms.length;

    const estados = ['pendiente', 'confirmada', 'cancelada', 'finalizada'];
    const citasPorEstado = estados.map(estado => ({
      estado_cita: estado,
      total: dbStore.appointments.filter(a => a.estado_cita === estado).length
    }));

    const citasPorEspecialidad = dbStore.specialties.map(esp => {
      const doctorIds = dbStore.doctors.filter(d => d.id_especialidad === esp.id_especialidad).map(d => d.id_medico);
      const total = dbStore.appointments.filter(a => doctorIds.includes(a.id_medico)).length;
      return {
        nombre_especialidad: esp.nombre_especialidad,
        total
      };
    });

    return res.json({
      success: true,
      stats: {
        totalCitas,
        totalMedicos,
        totalPacientes,
        totalSalas,
        citasPorEstado,
        citasPorEspecialidad
      }
    });
  } catch (error) {
    console.error('Error dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

// -------------------------------------------------------------
// USER MANAGEMENT (FULL CRUD: CREATE, READ, UPDATE, DELETE)
// -------------------------------------------------------------

export async function getUsers(_req: AuthenticatedRequest, res: Response) {
  try {
    if (isMySqlConnected && pool) {
      const query = `
        SELECT u.id_usuario, u.nombre_usuario, u.id_rol, r.nombre_rol,
          COALESCE(cli.nombre_cli, m.nombre_med, adm.nombre_adm) AS nombre,
          COALESCE(cli.apellido_cli, m.apellido_med, adm.apellido_adm) AS apellido,
          COALESCE(CONCAT(cli.nombre_cli, ' ', cli.apellido_cli), CONCAT(m.nombre_med, ' ', m.apellido_med), CONCAT(adm.nombre_adm, ' ', adm.apellido_adm)) AS nombre_completo,
          COALESCE(cli.telefono_cli, m.telefono_med, 'N/A') AS telefono,
          cli.nacimiento_cli,
          m.id_especialidad,
          esp.nombre_especialidad,
          m.equipo_disponible
        FROM tb_usuarios u
        JOIN tb_roles r ON u.id_rol = r.id_rol
        LEFT JOIN tb_clientes cli ON u.id_usuario = cli.id_usuario
        LEFT JOIN tb_medicos m ON u.id_usuario = m.id_usuario
        LEFT JOIN tb_especialidades esp ON m.id_especialidad = esp.id_especialidad
        LEFT JOIN tb_administradores adm ON u.id_usuario = adm.id_usuario
        ORDER BY u.id_usuario ASC
      `;
      const [rows] = await pool.query(query);
      return res.json({ success: true, users: rows });
    }

    const list = dbStore.users.map(u => {
      const rol = dbStore.roles.find(r => r.id_rol === u.id_rol);
      let nombre = '';
      let apellido = '';
      let telefono = 'N/A';
      let nacimiento_cli = '';
      let id_especialidad: number | undefined = undefined;
      let nombre_especialidad = '';
      let equipo_disponible = '';

      if (u.id_rol === 1) {
        const p = dbStore.patients.find(x => x.id_usuario === u.id_usuario);
        if (p) {
          nombre = p.nombre_cli;
          apellido = p.apellido_cli;
          telefono = p.telefono_cli;
          nacimiento_cli = p.nacimiento_cli;
        }
      } else if (u.id_rol === 2) {
        const d = dbStore.doctors.find(x => x.id_usuario === u.id_usuario);
        if (d) {
          nombre = d.nombre_med;
          apellido = d.apellido_med;
          telefono = d.telefono_med;
          id_especialidad = d.id_especialidad;
          const esp = dbStore.specialties.find(e => e.id_especialidad === d.id_especialidad);
          nombre_especialidad = esp?.nombre_especialidad || '';
          equipo_disponible = d.equipo_disponible;
        }
      } else if (u.id_rol === 3) {
        const a = dbStore.admins.find(x => x.id_usuario === u.id_usuario);
        if (a) {
          nombre = a.nombre_adm;
          apellido = a.apellido_adm;
        }
      }

      return {
        id_usuario: u.id_usuario,
        nombre_usuario: u.nombre_usuario,
        id_rol: u.id_rol,
        nombre_rol: rol?.nombre_rol || 'Desconocido',
        nombre,
        apellido,
        nombre_completo: `${nombre} ${apellido}`.trim() || u.nombre_usuario,
        telefono,
        nacimiento_cli,
        id_especialidad,
        nombre_especialidad,
        equipo_disponible
      };
    });

    return res.json({ success: true, users: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      id_rol, 
      nombre_usuario, 
      contrasenia, 
      nombre, 
      apellido, 
      telefono, 
      nacimiento_cli, 
      id_especialidad, 
      equipo_disponible 
    } = req.body;

    if (!id_rol || !nombre_usuario || !contrasenia || !nombre || !apellido) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    if (isMySqlConnected && pool) {
      const [exists]: any = await pool.query('SELECT id_usuario FROM tb_usuarios WHERE nombre_usuario = ?', [nombre_usuario]);
      if (exists.length > 0) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado' });
      }

      const [uRes]: any = await pool.query(
        'INSERT INTO tb_usuarios (nombre_usuario, contrasenia, id_rol) VALUES (?, ?, ?)',
        [nombre_usuario, contrasenia, id_rol]
      );
      const newUserId = uRes.insertId;

      if (Number(id_rol) === 1) {
        await pool.query(
          'INSERT INTO tb_clientes (nombre_cli, apellido_cli, nacimiento_cli, telefono_cli, id_usuario) VALUES (?, ?, ?, ?, ?)',
          [nombre, apellido, nacimiento_cli || '2000-01-01', telefono || '', newUserId]
        );
      } else if (Number(id_rol) === 2) {
        await pool.query(
          'INSERT INTO tb_medicos (nombre_med, apellido_med, id_especialidad, telefono_med, equipo_disponible, id_usuario) VALUES (?, ?, ?, ?, ?, ?)',
          [nombre, apellido, id_especialidad || 1, telefono || '', equipo_disponible || '', newUserId]
        );
      } else if (Number(id_rol) === 3) {
        await pool.query(
          'INSERT INTO tb_administradores (nombre_adm, apellido_adm, id_usuario) VALUES (?, ?, ?)',
          [nombre, apellido, newUserId]
        );
      }

      return res.status(201).json({ success: true, message: 'Usuario creado exitosamente', id_usuario: newUserId });
    }

    // In-memory
    if (dbStore.users.some(u => u.nombre_usuario === nombre_usuario)) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
    }

    const newUserId = dbStore.users.length > 0 ? Math.max(...dbStore.users.map(u => u.id_usuario)) + 1 : 1;
    dbStore.users.push({
      id_usuario: newUserId,
      nombre_usuario,
      contrasenia,
      id_rol: Number(id_rol)
    });

    if (Number(id_rol) === 1) {
      const newCliId = dbStore.patients.length > 0 ? Math.max(...dbStore.patients.map(p => p.id_cliente)) + 1 : 1;
      dbStore.patients.push({
        id_cliente: newCliId,
        nombre_cli: nombre,
        apellido_cli: apellido,
        nacimiento_cli: nacimiento_cli || '2000-01-01',
        telefono_cli: telefono || '',
        id_usuario: newUserId
      });
    } else if (Number(id_rol) === 2) {
      const newMedId = dbStore.doctors.length > 0 ? Math.max(...dbStore.doctors.map(d => d.id_medico)) + 1 : 1;
      dbStore.doctors.push({
        id_medico: newMedId,
        nombre_med: nombre,
        apellido_med: apellido,
        id_especialidad: Number(id_especialidad) || 1,
        telefono_med: telefono || '',
        equipo_disponible: equipo_disponible || '',
        id_usuario: newUserId
      });
    } else if (Number(id_rol) === 3) {
      const newAdmId = dbStore.admins.length > 0 ? Math.max(...dbStore.admins.map(a => a.id_administrador)) + 1 : 1;
      dbStore.admins.push({
        id_administrador: newAdmId,
        nombre_adm: nombre,
        apellido_adm: apellido,
        id_usuario: newUserId
      });
    }

    return res.status(201).json({ success: true, message: 'Usuario registrado con éxito', id_usuario: newUserId });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id_usuario = Number(req.params.id);
    const { 
      nombre_usuario, 
      contrasenia, 
      nombre, 
      apellido, 
      telefono, 
      nacimiento_cli, 
      id_especialidad, 
      equipo_disponible 
    } = req.body;

    if (isMySqlConnected && pool) {
      const [uRows]: any = await pool.query('SELECT * FROM tb_usuarios WHERE id_usuario = ?', [id_usuario]);
      if (uRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const user = uRows[0];

      // Update credentials if provided
      if (nombre_usuario) {
        await pool.query('UPDATE tb_usuarios SET nombre_usuario = ? WHERE id_usuario = ?', [nombre_usuario, id_usuario]);
      }
      if (contrasenia) {
        await pool.query('UPDATE tb_usuarios SET contrasenia = ? WHERE id_usuario = ?', [contrasenia, id_usuario]);
      }

      // Update role-specific entity
      if (user.id_rol === 1) { // Paciente
        await pool.query(
          'UPDATE tb_clientes SET nombre_cli = COALESCE(?, nombre_cli), apellido_cli = COALESCE(?, apellido_cli), telefono_cli = COALESCE(?, telefono_cli), nacimiento_cli = COALESCE(?, nacimiento_cli) WHERE id_usuario = ?',
          [nombre, apellido, telefono, nacimiento_cli, id_usuario]
        );
      } else if (user.id_rol === 2) { // Médico
        await pool.query(
          'UPDATE tb_medicos SET nombre_med = COALESCE(?, nombre_med), apellido_med = COALESCE(?, apellido_med), telefono_med = COALESCE(?, telefono_med), id_especialidad = COALESCE(?, id_especialidad), equipo_disponible = COALESCE(?, equipo_disponible) WHERE id_usuario = ?',
          [nombre, apellido, telefono, id_especialidad, equipo_disponible, id_usuario]
        );
      } else if (user.id_rol === 3) { // Administrador
        await pool.query(
          'UPDATE tb_administradores SET nombre_adm = COALESCE(?, nombre_adm), apellido_adm = COALESCE(?, apellido_adm) WHERE id_usuario = ?',
          [nombre, apellido, id_usuario]
        );
      }

      return res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    }

    // In-memory update
    const user = dbStore.users.find(u => u.id_usuario === id_usuario);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (nombre_usuario) user.nombre_usuario = nombre_usuario;
    if (contrasenia) user.contrasenia = contrasenia;

    if (user.id_rol === 1) {
      const p = dbStore.patients.find(x => x.id_usuario === id_usuario);
      if (p) {
        if (nombre) p.nombre_cli = nombre;
        if (apellido) p.apellido_cli = apellido;
        if (telefono !== undefined) p.telefono_cli = telefono;
        if (nacimiento_cli) p.nacimiento_cli = nacimiento_cli;
      }
    } else if (user.id_rol === 2) {
      const d = dbStore.doctors.find(x => x.id_usuario === id_usuario);
      if (d) {
        if (nombre) d.nombre_med = nombre;
        if (apellido) d.apellido_med = apellido;
        if (telefono !== undefined) d.telefono_med = telefono;
        if (id_especialidad) d.id_especialidad = Number(id_especialidad);
        if (equipo_disponible !== undefined) d.equipo_disponible = equipo_disponible;
      }
    } else if (user.id_rol === 3) {
      const a = dbStore.admins.find(x => x.id_usuario === id_usuario);
      if (a) {
        if (nombre) a.nombre_adm = nombre;
        if (apellido) a.apellido_adm = apellido;
      }
    }

    return res.json({ success: true, message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id_usuario = Number(req.params.id);

    // Prevent deleting own user
    if (req.user?.id_usuario === id_usuario) {
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propia cuenta de administrador en sesión' });
    }

    if (isMySqlConnected && pool) {
      const [uRows]: any = await pool.query('SELECT * FROM tb_usuarios WHERE id_usuario = ?', [id_usuario]);
      if (uRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }
      const user = uRows[0];

      if (user.id_rol === 1) {
        const [cli]: any = await pool.query('SELECT id_cliente FROM tb_clientes WHERE id_usuario = ?', [id_usuario]);
        if (cli.length > 0) {
          // Cancel active appointments of this client
          await pool.query('UPDATE tb_citas SET estado_cita = "cancelada" WHERE id_cliente = ?', [cli[0].id_cliente]);
          await pool.query('DELETE FROM tb_clientes WHERE id_cliente = ?', [cli[0].id_cliente]);
        }
      } else if (user.id_rol === 2) {
        const [med]: any = await pool.query('SELECT id_medico FROM tb_medicos WHERE id_usuario = ?', [id_usuario]);
        if (med.length > 0) {
          await pool.query('UPDATE tb_citas SET estado_cita = "cancelada" WHERE id_medico = ?', [med[0].id_medico]);
          await pool.query('DELETE FROM tb_horarios WHERE id_medico = ?', [med[0].id_medico]);
          await pool.query('DELETE FROM tb_medicos WHERE id_medico = ?', [med[0].id_medico]);
        }
      } else if (user.id_rol === 3) {
        await pool.query('DELETE FROM tb_administradores WHERE id_usuario = ?', [id_usuario]);
      }

      await pool.query('DELETE FROM tb_usuarios WHERE id_usuario = ?', [id_usuario]);
      return res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    }

    // In-memory delete
    const uIndex = dbStore.users.findIndex(u => u.id_usuario === id_usuario);
    if (uIndex === -1) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    const user = dbStore.users[uIndex];

    if (user.id_rol === 1) {
      const cli = dbStore.patients.find(p => p.id_usuario === id_usuario);
      if (cli) {
        dbStore.appointments.forEach(a => {
          if (a.id_cliente === cli.id_cliente) a.estado_cita = 'cancelada';
        });
        dbStore.patients = dbStore.patients.filter(p => p.id_usuario !== id_usuario);
      }
    } else if (user.id_rol === 2) {
      const doc = dbStore.doctors.find(d => d.id_usuario === id_usuario);
      if (doc) {
        dbStore.appointments.forEach(a => {
          if (a.id_medico === doc.id_medico) a.estado_cita = 'cancelada';
        });
        dbStore.schedules = dbStore.schedules.filter(s => s.id_medico !== doc.id_medico);
        dbStore.doctors = dbStore.doctors.filter(d => d.id_usuario !== id_usuario);
      }
    } else if (user.id_rol === 3) {
      dbStore.admins = dbStore.admins.filter(a => a.id_usuario !== id_usuario);
    }

    dbStore.users.splice(uIndex, 1);
    return res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

// -------------------------------------------------------------
// ADMIN RESERVATION MANAGEMENT (APROBAR, RECHAZAR, MODIFICAR)
// -------------------------------------------------------------

export async function approveAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const id_cita = Number(req.params.id);

    if (isMySqlConnected && pool) {
      await pool.query('UPDATE tb_citas SET estado_cita = "confirmada" WHERE id_cita = ?', [id_cita]);
      return res.json({ success: true, message: 'Cita aprobada y confirmada exitosamente' });
    }

    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    cita.estado_cita = 'confirmada';
    return res.json({ success: true, message: 'Cita aprobada y confirmada exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al aprobar cita' });
  }
}

export async function rejectAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const id_cita = Number(req.params.id);

    if (isMySqlConnected && pool) {
      const [citas]: any = await pool.query('SELECT * FROM tb_citas WHERE id_cita = ?', [id_cita]);
      if (citas.length === 0) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      const cita = citas[0];

      await pool.query('UPDATE tb_citas SET estado_cita = "cancelada" WHERE id_cita = ?', [id_cita]);
      await pool.query('UPDATE tb_horarios SET disponibilidad = 1 WHERE id_horario = ?', [cita.id_horario]);

      return res.json({ success: true, message: 'Cita rechazada y horario liberado exitosamente' });
    }

    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    cita.estado_cita = 'cancelada';
    const horario = dbStore.schedules.find(h => h.id_horario === cita.id_horario);
    if (horario) horario.disponibilidad = 1;

    return res.json({ success: true, message: 'Cita rechazada y horario liberado exitosamente' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al rechazar cita' });
  }
}

export async function modifyAppointment(req: AuthenticatedRequest, res: Response) {
  try {
    const id_cita = Number(req.params.id);
    const { id_medico, id_horario, id_sala, motivo_consulta, estado_cita } = req.body;

    if (isMySqlConnected && pool) {
      const [citas]: any = await pool.query('SELECT * FROM tb_citas WHERE id_cita = ?', [id_cita]);
      if (citas.length === 0) return res.status(404).json({ success: false, message: 'Cita no encontrada' });
      const cita = citas[0];

      // If horario changed
      if (id_horario && id_horario !== cita.id_horario) {
        // Free old schedule slot
        await pool.query('UPDATE tb_horarios SET disponibilidad = 1 WHERE id_horario = ?', [cita.id_horario]);
        // Reserve new schedule slot
        await pool.query('UPDATE tb_horarios SET disponibilidad = 0 WHERE id_horario = ?', [id_horario]);
      }

      await pool.query(
        `UPDATE tb_citas SET 
          id_medico = COALESCE(?, id_medico),
          id_horario = COALESCE(?, id_horario),
          id_sala = COALESCE(?, id_sala),
          motivo_consulta = COALESCE(?, motivo_consulta),
          estado_cita = COALESCE(?, estado_cita)
        WHERE id_cita = ?`,
        [id_medico, id_horario, id_sala, motivo_consulta, estado_cita, id_cita]
      );

      return res.json({ success: true, message: 'Cita modificada exitosamente por administración' });
    }

    // In-memory modify
    const cita = dbStore.appointments.find(a => a.id_cita === id_cita);
    if (!cita) return res.status(404).json({ success: false, message: 'Cita no encontrada' });

    if (id_horario && id_horario !== cita.id_horario) {
      const oldSlot = dbStore.schedules.find(s => s.id_horario === cita.id_horario);
      if (oldSlot) oldSlot.disponibilidad = 1;

      const newSlot = dbStore.schedules.find(s => s.id_horario === Number(id_horario));
      if (newSlot) newSlot.disponibilidad = 0;
      cita.id_horario = Number(id_horario);
    }

    if (id_medico) cita.id_medico = Number(id_medico);
    if (id_sala) cita.id_sala = Number(id_sala);
    if (motivo_consulta) cita.motivo_consulta = motivo_consulta;
    if (estado_cita) cita.estado_cita = estado_cita;

    return res.json({ success: true, message: 'Cita modificada exitosamente por administración' });
  } catch (error) {
    console.error('Error al modificar cita:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}
