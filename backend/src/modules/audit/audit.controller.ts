import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { paginatedResponse, successResponse } from '../../utils/apiResponse';
import { getQueryParam } from '../../utils/reqQuery';

export async function getAuditLogs(req: Request, res: Response) {
  const page = Math.max(1, parseInt(getQueryParam(req, 'page') || '1'));
  const limit = Math.max(1, Math.min(100, parseInt(getQueryParam(req, 'limit') || '20')));
  const skip = (page - 1) * limit;

  const where: any = {};
  const action = getQueryParam(req, 'action');
  const projectId = getQueryParam(req, 'projectId');
  const userId = getQueryParam(req, 'userId');
  if (action) where.action = action;
  if (projectId) where.projectId = projectId;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginatedResponse(res, 200, 'Audit log berhasil diambil', logs, page, limit, total);
}

export async function getProjectAuditLogs(req: Request, res: Response) {
  const { projectId } = req.params;

  const logs = await prisma.auditLog.findMany({
    where: { projectId: projectId as string },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, username: true, fullName: true, role: true } } },
  });

  return successResponse(res, 200, 'Audit log project berhasil diambil', logs);
}
