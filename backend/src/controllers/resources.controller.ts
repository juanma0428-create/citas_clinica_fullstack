import { Request, Response } from 'express';
import { dbStore, pool, isMySqlConnected } from '../config/db.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

export async function getSpecialties(_req: Request, res: Response) {
  try {
    if (isMySqlConnected && pool) {
      const [rows] = await pool.query('SELECT * FROM tb_especialidades ORDER BY nombre_especialidad ASC');
      return res.json({ success: true, specialties: rows });
    }
    return res.json({ success: true, specialties: dbStore.specialties });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
}

export async function getRooms(req: Request, res: Response) {
  try {
    const { id_especialidad } = req.query;

    if (isMySqlConnected && pool) {
      let query = `
        SELECT s.*, esp.nombre_especialidad 
        FROM tb_salas s
        JOIN tb_especialidades esp ON s.id_especialidad = esp.id_especialidad
        WHERE 1=1
      `;
      const params: any[] = [];
      if (id_especialidad) {
        query += ' AND s.id_especialidad = ?';
        params.push(Number(id_especialidad));
      }
      query += ' ORDER BY s.nombre_sala ASC';
      const [rows] = await pool.query(query, params);
      return res.json({ success: true, rooms: rows });
    }

    let list = dbStore.rooms.map(r => {
      const esp = dbStore.specialties.find(e => e.id_especialidad === r.id_especialidad);
      return {
        id_sala: r.id_sala,
        nombre_sala: r.nombre_sala,
        id_especialidad: r.id_especialidad,
        nombre_especialidad: esp?.nombre_especialidad || ''
      };
    });

    if (id_especialidad) {
      list = list.filter(r => r.id_especialidad === Number(id_especialidad));
    }

    return res.json({ success: true, rooms: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
}

export async function createRoom(req: AuthenticatedRequest, res: Response) {
  try {
    const { nombre_sala, id_especialidad } = req.body;
    if (!nombre_sala || !id_especialidad) {
      return res.status(400).json({ success: false, message: 'Nombre de sala y especialidad son requeridos' });
    }

    if (isMySqlConnected && pool) {
      const [result]: any = await pool.query('INSERT INTO tb_salas (nombre_sala, id_especialidad) VALUES (?, ?)', [nombre_sala, id_especialidad]);
      return res.status(201).json({ success: true, message: 'Sala creada con éxito', id_sala: result.insertId });
    }

    const newId = dbStore.rooms.length > 0 ? Math.max(...dbStore.rooms.map(r => r.id_sala)) + 1 : 1;
    const newRoom = { id_sala: newId, nombre_sala, id_especialidad: Number(id_especialidad) };
    dbStore.rooms.push(newRoom);

    return res.status(201).json({ success: true, message: 'Sala creada con éxito', room: newRoom });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al crear sala' });
  }
}

export async function getEquipment(req: Request, res: Response) {
  try {
    if (isMySqlConnected && pool) {
      const [rows] = await pool.query(`
        SELECT eq.*, esp.nombre_especialidad
        FROM tb_equipos eq
        JOIN tb_especialidades esp ON eq.id_especialidad = esp.id_especialidad
        ORDER BY eq.nombre ASC
      `);
      return res.json({ success: true, equipment: rows });
    }

    const list = dbStore.equipments.map(eq => {
      const esp = dbStore.specialties.find(e => e.id_especialidad === eq.id_especialidad);
      return {
        id_equipo: eq.id_equipo,
        nombre: eq.nombre,
        id_especialidad: eq.id_especialidad,
        cantidad: eq.cantidad,
        nombre_especialidad: esp?.nombre_especialidad || ''
      };
    });

    return res.json({ success: true, equipment: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
}

export async function createEquipment(req: AuthenticatedRequest, res: Response) {
  try {
    const { nombre, id_especialidad, cantidad } = req.body;
    if (!nombre || !id_especialidad || cantidad === undefined) {
      return res.status(400).json({ success: false, message: 'Nombre, especialidad y cantidad son requeridos' });
    }

    if (isMySqlConnected && pool) {
      const [result]: any = await pool.query(
        'INSERT INTO tb_equipos (nombre, id_especialidad, cantidad) VALUES (?, ?, ?)',
        [nombre, id_especialidad, cantidad]
      );
      return res.status(201).json({ success: true, message: 'Equipo registrado exitosamente', id_equipo: result.insertId });
    }

    const newId = dbStore.equipments.length > 0 ? Math.max(...dbStore.equipments.map(e => e.id_equipo)) + 1 : 1;
    const newEq = { id_equipo: newId, nombre, id_especialidad: Number(id_especialidad), cantidad: Number(cantidad) };
    dbStore.equipments.push(newEq);

    return res.status(201).json({ success: true, message: 'Equipo registrado exitosamente', equipment: newEq });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al registrar equipo' });
  }
}
