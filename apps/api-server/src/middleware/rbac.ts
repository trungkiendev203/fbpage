import { Response, NextFunction } from 'express';
import { Role } from 'db-prisma';
import { AuthenticatedRequest } from './auth';

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated' });
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
