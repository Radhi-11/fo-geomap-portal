import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { successResponse } from '../../utils/apiResponse';
import { formatIndonesianDate } from '../../utils/dateFormat';
import { AuthRequest } from '../../middlewares/auth';

export async function getDashboardSummary(req: AuthRequest, res: Response) {
  const userRole = req.user?.role || 'VIEWER';
  const userId = req.user?.userId;

  const isNonAdmin = userRole !== 'ADMIN';
  const userFilter: any = isNonAdmin && userId ? { technicianId: userId } : {};

  const [
    totalProjects,
    submitted,
    processing,
    needReview,
    validated,
    rejected,
    totalProjectValue,
    totalCableLength,
  ] = await Promise.all([
    prisma.project.count({ where: userFilter }),
    prisma.project.count({ where: { status: 'SUBMITTED', ...userFilter } }),
    prisma.project.count({ where: { status: 'PROCESSING', ...userFilter } }),
    prisma.project.count({ where: { status: 'NEED_REVIEW', ...userFilter } }),
    prisma.project.count({ where: { status: 'VALIDATED', ...userFilter } }),
    prisma.project.count({ where: { status: 'REJECTED', ...userFilter } }),
    prisma.project.aggregate({ _sum: { boqTotalValue: true }, where: userFilter }),
    prisma.kmzRoute.aggregate({ _sum: { lengthKm: true } }),
  ]);

  const lengthDiff = await prisma.project.aggregate({
    _sum: { totalPriceDifference: true },
    where: { ...userFilter, status: { in: ['VALIDATED', 'NEED_REVIEW'] } },
  });

  return successResponse(res, 200, 'Dashboard summary berhasil diambil', {
    totalProjects,
    submitted,
    processing,
    needReview,
    validated,
    rejected,
    totalProjectValue: totalProjectValue?._sum?.boqTotalValue || 0,
    totalPriceDifference: lengthDiff?._sum?.totalPriceDifference || 0,
    totalCableLengthKm: totalCableLength?._sum?.lengthKm || 0,
  });
}

export async function getMonthlyStats(req: AuthRequest, res: Response) {
  const userRole = req.user?.role || 'VIEWER';
  const userId = req.user?.userId;
  const isNonAdmin = userRole !== 'ADMIN';

  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const province = req.query.province as string | undefined;
  const city = req.query.city as string | undefined;

  const where: any = {
    createdAt: {
      gte: new Date(`${year}-01-01T00:00:00.000Z`),
      lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
    },
  };
  if (province) where.province = province;
  if (city) where.city = city;
  if (isNonAdmin && userId) where.technicianId = userId;

  const projects = await prisma.project.findMany({ where });

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const monthlyData: Record<number, any> = {};

  for (let m = 0; m < 12; m++) {
    monthlyData[m] = {
      month: `${year}-${String(m + 1).padStart(2, '0')}`,
      projectCount: 0,
      validated: 0,
      needReview: 0,
      projectValue: 0,
    };
  }

  for (const project of projects) {
    const month = new Date(project.createdAt).getMonth();
    monthlyData[month].projectCount += 1;
    if (project.status === 'VALIDATED') monthlyData[month].validated += 1;
    if (project.status === 'NEED_REVIEW') monthlyData[month].needReview += 1;
    monthlyData[month].projectValue += project.boqTotalValue || 0;
  }

  const result = Object.values(monthlyData).filter((d) => d.projectCount > 0);

  return successResponse(res, 200, 'Data statistik bulanan berhasil diambil', result);
}
