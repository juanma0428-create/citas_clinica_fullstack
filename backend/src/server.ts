import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { initDatabaseConnection } from './config/db.js';
import { authMiddleware } from './middlewares/auth.js';
import { roleMiddleware } from './middlewares/role.js';

import { login, register, getProfile, getDemoUsers } from './controllers/auth.controller.js';
import { 
  getAppointments, 
  createAppointment, 
  cancelAppointment, 
  rescheduleAppointment, 
  attendAppointment,
  getNotifications 
} from './controllers/appointment.controller.js';
import { getDoctors, getDoctorSchedules, addDoctorSchedule } from './controllers/doctor.controller.js';
import { 
  getSpecialties, 
  getRooms, 
  createRoom, 
  getEquipment, 
  createEquipment 
} from './controllers/resources.controller.js';
import { 
  getDashboardStats, 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  modifyAppointment,
  approveAppointment,
  rejectAppointment
} from './controllers/admin.controller.js';

dotenv.config();

// Candidatos para ubicar el frontend compilado (sea desde root o desde backend)
const candidatePaths = [
  path.resolve(process.cwd(), 'frontend/dist/frontend/browser'),
  path.resolve(process.cwd(), '../frontend/dist/frontend/browser'),
  path.resolve(__dirname, '../../frontend/dist/frontend/browser'),
  path.resolve(__dirname, '../frontend/dist/frontend/browser')
];
const frontendDist = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Endpoint de prueba de salud
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SysCitas Medical API', timestamp: new Date().toISOString() });
});

// Rutas de Autenticación
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);
app.get('/api/auth/profile', authMiddleware, getProfile);
app.get('/api/auth/demo-users', getDemoUsers);

// Rutas de Citas
app.get('/api/citas', authMiddleware, getAppointments);
app.post('/api/citas', authMiddleware, createAppointment);
app.put('/api/citas/:id/cancelar', authMiddleware, cancelAppointment);
app.put('/api/citas/:id/reprogramar', authMiddleware, rescheduleAppointment);
app.put('/api/citas/:id/atender', authMiddleware, roleMiddleware([2, 3]), attendAppointment);
app.get('/api/notificaciones', authMiddleware, getNotifications);

// Rutas de Médicos y Horarios
app.get('/api/medicos', getDoctors);
app.get('/api/medicos/:id/horarios', getDoctorSchedules);
app.post('/api/medicos/:id/horarios', authMiddleware, roleMiddleware([2, 3]), addDoctorSchedule);

// Rutas de Recursos
app.get('/api/especialidades', getSpecialties);
app.get('/api/salas', getRooms);
app.post('/api/salas', authMiddleware, roleMiddleware([3]), createRoom);
app.get('/api/equipos', getEquipment);
app.post('/api/equipos', authMiddleware, roleMiddleware([3]), createEquipment);

// Rutas de Administración - Dashboard y Estadísticas
app.get('/api/admin/dashboard', authMiddleware, roleMiddleware([3]), getDashboardStats);

// Rutas de Administración - CRUD Completo de Usuarios
app.get('/api/admin/usuarios', authMiddleware, roleMiddleware([3]), getUsers);
app.post('/api/admin/usuarios', authMiddleware, roleMiddleware([3]), createUser);
app.put('/api/admin/usuarios/:id', authMiddleware, roleMiddleware([3]), updateUser);
app.delete('/api/admin/usuarios/:id', authMiddleware, roleMiddleware([3]), deleteUser);

// Rutas de Administración - Gestión Integral de Citas (Aprobar, Rechazar, Modificar)
app.put('/api/admin/citas/:id/aprobar', authMiddleware, roleMiddleware([3]), approveAppointment);
app.put('/api/admin/citas/:id/rechazar', authMiddleware, roleMiddleware([3]), rejectAppointment);
app.put('/api/admin/citas/:id/modificar', authMiddleware, roleMiddleware([3]), modifyAppointment);

// Servir frontend compilado de Angular en el mismo puerto 3000
if (fs.existsSync(frontendDist)) {
  console.log(`📦 Frontend estático Angular detectado en: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  console.warn(`⚠️ Frontend estático no encontrado en ${frontendDist}. Solo rutas /api disponibles.`);
}

// Inicializar y escuchar
async function startServer() {
  await initDatabaseConnection();
  app.listen(PORT, () => {
    console.log(`🚀 SysCitas Backend & Frontend unificado corriendo en http://localhost:${PORT}`);
  });
}

startServer();
