import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { successResponse } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';

export async function downloadFile(req: Request, res: Response) {
  const { fileId } = req.params;

  const file = await prisma.projectFile.findUnique({
    where: { id: fileId as string },
    include: { project: true },
  });

  if (!file) {
    return res.status(404).json({
      success: false,
      message: 'File tidak ditemukan',
      errorCode: 'FILE_NOT_FOUND',
    });
  }

  res.download(file.filePath, file.originalName, (err) => {
    if (err) {
      logger.error('File download error:', err);
    }
  });
}

export async function listProjectFiles(req: Request, res: Response) {
  const { projectId } = req.params;

  const files = await prisma.projectFile.findMany({
    where: { projectId: projectId as string },
    include: { uploadedBy: { select: { id: true, fullName: true, username: true } } },
    orderBy: { uploadedAt: 'desc' },
  });

  return successResponse(res, 200, 'Daftar file project', files);
}
