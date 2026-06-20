import type { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendUnauthorized } from '../utils/api-response';

// extend Request agar bisa akses req.user di controller
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendUnauthorized(res, 'Token tidak ditemukan', [
      { field: 'authorization', message: 'Header Authorization dengan Bearer token wajib disertakan' },
    ]);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token!);
    req.user = decoded;
    next();
  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.message === 'jwt expired';
    sendUnauthorized(res, isExpired ? 'Token sudah expired' : 'Token tidak valid', [
      { field: 'token', message: isExpired ? 'Silakan login kembali' : 'Token tidak valid atau telah dimanipulasi' },
    ]);
  }
};
