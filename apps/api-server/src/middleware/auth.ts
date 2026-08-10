import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { PrismaClient, Role } from 'db-prisma';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    roles: Role[];
  };
  session?: {
    id: string;
    userId: string;
  };
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // In development mode, auto-login as Super Admin if no session cookie exists
    if (process.env.NODE_ENV !== 'production') {
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@fbpage.local' },
        include: { roles: true },
      });
      if (adminUser) {
        req.user = {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.fullName,
          roles: adminUser.roles.map((r: any) => r.role as Role),
        };
        req.session = {
          id: 'dev-session-id',
          userId: adminUser.id,
        };
        return next();
      }
    }
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session token required' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date() || session.revokedAt) {
      if (process.env.NODE_ENV !== 'production') {
        const adminUser = await prisma.user.findFirst({
          where: { email: 'admin@fbpage.local' },
          include: { roles: true },
        });
        if (adminUser) {
          req.user = {
            id: adminUser.id,
            email: adminUser.email,
            fullName: adminUser.fullName,
            roles: adminUser.roles.map((r: any) => r.role as Role),
          };
          req.session = {
            id: 'dev-session-id',
            userId: adminUser.id,
          };
          return next();
        }
      }
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Session invalid or expired' });
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roles: session.user.roles.map((r: any) => r.role as Role),
    };
    req.session = {
      id: session.id,
      userId: session.userId,
    };

    next();
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Authentication error' });
  }
}
