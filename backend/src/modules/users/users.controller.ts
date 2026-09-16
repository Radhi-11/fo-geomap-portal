import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../config/prisma';
import { paginatedResponse, successResponse } from '../../utils/apiResponse';
import { getQueryParam, getQueryParamAsNumber } from '../../utils/reqQuery';
import { AuthRequest } from '../../middlewares/auth';
import { hashPassword } from '../auth/auth.service';
import { toAuthUser } from '../auth/auth.service';
import { UserRole } from '@prisma/client';

const createUserSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  role: z.enum(['ADMIN', 'VALIDATOR', 'VIEWER', 'TECHNICIAN']),
});

export async function listUsers(req: Request, res: Response) {
  const page = getQueryParamAsNumber(req, 'page', 1) || 1;
  const limit = Math.max(1, Math.min(100, getQueryParamAsNumber(req, 'limit', 20) || 20));
  const skip = (page - 1) * limit;
  const search = getQueryParam(req, 'search');
  const roleFilter = getQueryParam(req, 'role');

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (roleFilter) where.role = roleFilter;

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(res, 200, 'Daftar pengguna berhasil diambil', users.map(u => toAuthUser(u)), page, limit, total);
};

export async function createUser(req: AuthRequest, res: Response) {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const { username, email, fullName, role } = result.data;

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

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      fullName,
      role: role as UserRole,
      password: hashedPassword,
      mustChangePw: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'USER_CREATED',
      description: `User ${username} (${role}) dibuat dengan password sementara`,
    },
  });

  return successResponse(res, 201, 'Pengguna berhasil dibuat', {
    user: toAuthUser(user),
    tempPassword,
  });
};

export async function getUser(req: Request, res: Response) {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan', errorCode: 'USER_NOT_FOUND' });
  }
  return successResponse(res, 200, 'Detail pengguna', toAuthUser(user));
};

export async function deleteUser(req: AuthRequest, res: Response) {
  const id = req.params.id as string;

  if (req.user && req.user.userId === id) {
    return res.status(400).json({
      success: false,
      message: 'Tidak dapat menghapus akun sendiri',
      errorCode: 'USER_SELF_DELETE',
    });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User tidak ditemukan', errorCode: 'USER_NOT_FOUND' });
  }

  await prisma.user.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: req.user!.userId,
      action: 'USER_DELETED',
      description: `User ${user.username} dihapus`,
    },
  });

  return successResponse(res, 200, 'Pengguna berhasil dihapus');
};
