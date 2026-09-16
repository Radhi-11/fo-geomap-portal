import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username atau email wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Email tidak valid'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['ADMIN', 'VALIDATOR', 'VIEWER', 'TECHNICIAN']).optional().default('TECHNICIAN'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

export const changeCredentialsSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  password: z.string().optional(),
}).refine(
  (data) => !data.password || data.password.length >= 6,
  { message: 'Password minimal 6 karakter' },
);
