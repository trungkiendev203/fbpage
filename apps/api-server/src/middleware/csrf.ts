import { Request, Response, NextFunction } from 'express';

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bypass strict CSRF check in development mode when cookie isn't set yet
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies?.['csrf_token'];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return res.status(403).json({ error: 'CSRF_INVALID', message: 'Invalid or missing CSRF token' });
  }

  next();
}
