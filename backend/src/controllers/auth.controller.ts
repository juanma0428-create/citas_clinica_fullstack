import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/jwt.js';
import { dbStore, pool, isMySqlConnected } from '../config/db.js';
import { AuthenticatedRequest, AuthUserPayload } from '../middlewares/auth.js';

async function verifyAndUpgradePassword(provided: string, stored: string, userId: number): Promise<boolean> {
  let isMatch = false;
  const isBcrypt = stored.startsWith('$2a$') || stored.startsWith('$2b$');

  if (isBcrypt) {
    isMatch = await bcrypt.compare(provided, stored);
  } else {
    isMatch = provided === stored;
    // Upgrade legacy plaintext to bcrypt
    if (isMatch) {
      const hashed = await bcrypt.hash(provided, 10);
      if (isMySqlConnected && pool) {
        pool.query('UPDATE tb_usuarios SET contrasenia = ? WHERE id_usuario = ?', [hashed, userId]).catch(console.error);
      } else {
        const u = dbStore.users.find(x => x.id_usuario === userId);
        if (u) u.contrasenia = hashed;
      }
    }
  }

  return isMatch;
}

export async function login(req: Request, res: Response) {
  try {
    const { nombre_usuario, contrasenia } = req.body;

    if (!nombre_usuario || !contrasenia) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
    }

    if (isMySqlConnected && pool) {
      const [userRows]: any = await pool.query(
        'SELECT u.*, r.nombre_rol FROM tb_usuarios u JOIN tb_roles r ON u.id_rol = r.id_rol WHERE u.nombre_usuario = ?',
        [nombre_usuario]
      );

      if (!userRows || userRows.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      const user = userRows[0];
      const valid = await verifyAndUpgradePassword(contrasenia, user.contrasenia, user.id_usuario);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }

      let id_especifico = 0;
      let nombre_completo = user.nombre_usuario;

      if (user.id_rol === 1) { // Paciente
        const [cli]: any = await pool.query('SELECT * FROM tb_clientes WHERE id_usuario = ?', [user.id_usuario]);
        if (cli.length > 0) {
          id_especifico = cli[0].id_cliente;
          nombre_completo = `${cli[0].nombre_cli} ${cli[0].apellido_cli}`;
        }
      } else if (user.id_rol === 2) { // Médico
        const [med]: any = await pool.query('SELECT * FROM tb_medicos WHERE id_usuario = ?', [user.id_usuario]);
        if (med.length > 0) {
          id_especifico = med[0].id_medico;
          nombre_completo = `Dr. ${med[0].nombre_med} ${med[0].apellido_med}`;
        }
      } else if (user.id_rol === 3) { // Administrador
        const [adm]: any = await pool.query('SELECT * FROM tb_administradores WHERE id_usuario = ?', [user.id_usuario]);
        if (adm.length > 0) {
          id_especifico = adm[0].id_administrador;
          nombre_completo = `${adm[0].nombre_adm} ${adm[0].apellido_adm}`;
        }
      }

      const payload: AuthUserPayload = {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        id_rol: user.id_rol,
        rol_nombre: user.nombre_rol,
        id_especifico,
        nombre_completo
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      return res.json({ success: true, message: 'Inicio de sesión exitoso', token, user: payload });
    }

    // In-memory fallback with seeded sys_citas.sql data
    const user = dbStore.users.find(u => u.nombre_usuario === nombre_usuario);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const valid = await verifyAndUpgradePassword(contrasenia, user.contrasenia, user.id_usuario);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }

    const role = dbStore.roles.find(r => r.id_rol === user.id_rol);
    let id_especifico = 0;
    let nombre_completo = user.nombre_usuario;

    if (user.id_rol === 1) {
      const patient = dbStore.patients.find(p => p.id_usuario === user.id_usuario);
      if (patient) {
        id_especifico = patient.id_cliente;
        nombre_completo = `${patient.nombre_cli} ${patient.apellido_cli}`;
      }
    } else if (user.id_rol === 2) {
      const doctor = dbStore.doctors.find(d => d.id_usuario === user.id_usuario);
      if (doctor) {
        id_especifico = doctor.id_medico;
        nombre_completo = `Dr(a). ${doctor.nombre_med} ${doctor.apellido_med}`;
      }
    } else if (user.id_rol === 3) {
      const admin = dbStore.admins.find(a => a.id_usuario === user.id_usuario);
      if (admin) {
        id_especifico = admin.id_administrador;
        nombre_completo = `${admin.nombre_adm} ${admin.apellido_adm}`;
      }
    }

    const payload: AuthUserPayload = {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      id_rol: user.id_rol,
      rol_nombre: role ? role.nombre_rol : 'Usuario',
      id_especifico,
      nombre_completo
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ success: true, message: 'Inicio de sesión exitoso', token, user: payload });
  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { nombre_usuario, contrasenia, nombre_cli, apellido_cli, nacimiento_cli, telefono_cli } = req.body;

    if (!nombre_usuario || !contrasenia || !nombre_cli || !apellido_cli || !nacimiento_cli) {
      return res.status(400).json({ success: false, message: 'Todos los campos obligatorios deben ser completados' });
    }

    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    if (isMySqlConnected && pool) {
      const [existing]: any = await pool.query('SELECT id_usuario FROM tb_usuarios WHERE nombre_usuario = ?', [nombre_usuario]);
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
      }

      const [userResult]: any = await pool.query(
        'INSERT INTO tb_usuarios (nombre_usuario, contrasenia, id_rol) VALUES (?, ?, 1)',
        [nombre_usuario, hashedPassword]
      );
      const newUserId = userResult.insertId;

      await pool.query(
        'INSERT INTO tb_clientes (nombre_cli, apellido_cli, nacimiento_cli, telefono_cli, id_usuario) VALUES (?, ?, ?, ?, ?)',
        [nombre_cli, apellido_cli, nacimiento_cli, telefono_cli || '', newUserId]
      );

      return res.status(201).json({ success: true, message: 'Paciente registrado exitosamente. Ya puedes iniciar sesión.' });
    }

    // In-memory
    const exists = dbStore.users.some(u => u.nombre_usuario === nombre_usuario);
    if (exists) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya está registrado' });
    }

    const newUserId = dbStore.users.length + 1;
    dbStore.users.push({
      id_usuario: newUserId,
      nombre_usuario,
      contrasenia: hashedPassword,
      id_rol: 1
    });

    const newClientId = dbStore.patients.length + 1;
    dbStore.patients.push({
      id_cliente: newClientId,
      nombre_cli,
      apellido_cli,
      nacimiento_cli,
      telefono_cli: telefono_cli || '',
      id_usuario: newUserId
    });

    return res.status(201).json({ success: true, message: 'Paciente registrado con éxito' });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
}

export function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'No autenticado' });
  }
  return res.json({ success: true, user: req.user });
}

export function getDemoUsers(_req: Request, res: Response) {
  return res.json({
    success: true,
    demoUsers: [
      { rol: 'Paciente', username: 'paciente_juan', pass: 'clave123', descripcion: 'Juan Manuel Chica (Historial médico disponible)' },
      { rol: 'Paciente', username: 'paciente_maria', pass: 'clave123', descripcion: 'María García (Cita pediátrica activa)' },
      { rol: 'Médico', username: 'dr_carlos', pass: 'clave123', descripcion: 'Dr. Carlos López (Cardiología)' },
      { rol: 'Médico', username: 'dra_ana', pass: 'clave123', descripcion: 'Dra. Ana Martínez (Pediatría)' },
      { rol: 'Administrador', username: 'admin_roberto', pass: 'clave123', descripcion: 'Roberto Sánchez (Gestión total del sistema)' }
    ]
  });
}
