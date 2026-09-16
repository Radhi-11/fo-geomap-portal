import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan',
      errorCode: 'AUTH_TOKEN_MISSING',
    });
  }

  try {
    const secret = config.jwt.accessSecret;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET not configured');
    }
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token kadaluarsa',
        errorCode: 'AUTH_TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid',
      errorCode: 'AUTH_TOKEN_INVALID',
    });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Autentikasi diperlukan',
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const roleHierarchy: Record<string, number> = {
      ADMIN: 4,
      VALIDATOR: 3,
      TECHNICIAN: 2,
      VIEWER: 1,
    };

    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = Math.max(
      ...allowedRoles.map((r) => roleHierarchy[r] || 0),
    );

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Izin tidak cukup',
        errorCode: 'ACCESS_FORBIDDEN',
      });
    }

    next();
  };
}
