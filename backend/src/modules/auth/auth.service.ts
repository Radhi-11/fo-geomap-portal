import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../../config';
import { AuthUser, JwtPayload } from '../../types';
import { UserRole } from '@prisma/client';

export function generateAccessToken(payload: JwtPayload): string {
  const secret = config.jwt.accessSecret;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });
}

export function generateRefreshToken(payload: JwtPayload): string {
  const secret = config.jwt.refreshSecret;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });
}

export function generateTokens(user: {
  userId: string;
  username: string;
  role: string;
  fullName?: string;
}): { accessToken: string; refreshToken: string; } {
  const payload: JwtPayload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function mapUserRoleFrontend(role: UserRole): 'admin' | 'user' {
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.VALIDATOR:
      return 'admin';
    case UserRole.TECHNICIAN:
    case UserRole.VIEWER:
      return 'user';
    default:
      return 'user';
  }
}

export function mapProjectStatusToFrontend(
  status: string,
): 'PENDING' | 'VERIFIED' | 'REVISION' | 'REJECTED' | 'ERROR' {
  switch (status) {
    case 'VALIDATED':
      return 'VERIFIED';
    case 'NEED_REVIEW':
      return 'PENDING';
    case 'REVISION':
      return 'REVISION';
    case 'REJECTED':
      return 'REJECTED';
    case 'PROCESSING':
      return 'PENDING';
    case 'DRAFT':
    case 'SUBMITTED':
    default:
      return 'PENDING';
  }
}

export function toAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    frontendRole: mapUserRoleFrontend(user.role),
    fullName: user.fullName,
    company: user.company,
    mustChangePassword: user.mustChangePw,
    createdAt: user.createdAt,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
