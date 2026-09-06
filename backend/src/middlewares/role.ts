import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export function roleMiddleware(allowedRoles: number[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(req.user.id_rol)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
}
