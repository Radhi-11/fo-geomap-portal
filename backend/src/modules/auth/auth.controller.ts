import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { JwtPayload } from '../../types';
import { generateTokens, toAuthUser, comparePassword, hashPassword } from './auth.service';
import { successResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth';
import { loginSchema, registerSchema, changePasswordSchema, changeCredentialsSchema } from './auth.validators';
import prisma from '../../config/prisma';

export async function login(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const { username, password } = result.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }],
    },
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Username/email atau password salah',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
    });
  }

  const passwordValid = await comparePassword(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      message: 'Username/email atau password salah',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
    });
  }

  const tokens = generateTokens({
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName ?? undefined,
  });

  return successResponse(res, 200, 'Login berhasil', {
    user: toAuthUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function register(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const { username, email, fullName, password, role } = result.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Username atau email sudah digunakan',
      errorCode: 'USER_DUPLICATE',
    });
  }

  const hashedPassword = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      fullName,
      password: hashedPassword,
      role: role as any,
      mustChangePw: false,
    },
  });

  return successResponse(res, 201, 'Registrasi berhasil', {
    user: toAuthUser(newUser),
  });
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan',
      errorCode: 'AUTH_REQUIRED',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
      errorCode: 'USER_NOT_FOUND',
    });
  }

  return successResponse(res, 200, 'Data user berhasil diambil', toAuthUser(user));
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token wajib diisi',
      errorCode: 'REFRESH_TOKEN_MISSING',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid',
        errorCode: 'AUTH_TOKEN_INVALID',
      });
    }

    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return successResponse(res, 200, 'Token berhasil diperbarui', {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token tidak valid',
      errorCode: 'AUTH_TOKEN_INVALID',
    });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  const result = changePasswordSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const { currentPassword, newPassword } = result.data;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
      errorCode: 'USER_NOT_FOUND',
    });
  }

  const passwordValid = await comparePassword(currentPassword, user.password);
  if (!passwordValid) {
    return res.status(401).json({
      success: false,
      message: 'Password saat ini salah',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: await hashPassword(newPassword),
      mustChangePw: false,
    },
  });

  return successResponse(res, 200, 'Password berhasil diperbarui');
}

export async function changeCredentials(req: AuthRequest, res: Response) {
  const result = changeCredentialsSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const { username, fullName, password } = result.data;
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User tidak ditemukan',
      errorCode: 'USER_NOT_FOUND',
    });
  }

  const existing = await prisma.user.findFirst({
    where: {
      AND: [{ id: { not: userId } }, { username }],
    },
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'Username sudah digunakan oleh pengguna lain',
      errorCode: 'USER_DUPLICATE',
    });
  }

  const updateData: any = { username, fullName };
  if (password) {
    updateData.password = await hashPassword(password);
    updateData.mustChangePw = false;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return successResponse(res, 200, 'Kredensial berhasil diperbarui', toAuthUser(updated));
}

export async function logout(req: Request, res: Response) {
  return successResponse(res, 200, 'Logout berhasil');
}
