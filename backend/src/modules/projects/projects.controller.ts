import { Request, Response } from 'express';
import { ProjectService } from './projects.service';
import { paginatedResponse, successResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middlewares/auth';
import { getQueryParam } from '../../utils/reqQuery';
import { logger } from '../../utils/logger';

const projectService = new ProjectService();

export async function createProject(req: AuthRequest, res: Response) {
  const files = req.files as any;
  const kmzFile = files?.kmzFile;
  const boqFile = files?.boqFile;

  let kmzFilePath: string | undefined;
  let boqFilePath: string | undefined;

  if (kmzFile && Array.isArray(kmzFile) && kmzFile.length > 0) {
    kmzFilePath = kmzFile[0].path;
  }

  if (boqFile && Array.isArray(boqFile) && boqFile.length > 0) {
    boqFilePath = boqFile[0].path;
  }

  try {
    const result = await projectService.createProject({
      projectName: req.body.projectName,
      kmzFilePath,
      boqFilePath,
      technicianId: req.user!.userId,
      technicianName: req.user!.fullName,
    });

    return successResponse(res, 201, 'Project berhasil dibuat', result);
  } catch (err: any) {
    logger.error('Create project failed:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Gagal membuat project',
      errorCode: 'PROJECT_CREATE_ERROR',
    });
  }
}

export async function listProjects(req: AuthRequest, res: Response) {
  const result = await projectService.listProjects({
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 20,
    status: getQueryParam(req, 'status'),
    province: getQueryParam(req, 'province'),
    city: getQueryParam(req, 'city'),
    search: getQueryParam(req, 'search'),
    userId: req.user!.userId,
    role: req.user!.role,
  });

  return paginatedResponse(
    res, 200, 'Daftar project berhasil diambil',
    result.projects,
    result.page,
    result.limit,
    result.total,
  );
}

export async function getProject(req: Request, res: Response) {
  const project = await projectService.getProjectDetail(req.params.id as string);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }
  return successResponse(res, 200, 'Detail project', project);
}

export async function updateProject(req: Request, res: Response) {
  try {
    const project = await projectService.updateProject(req.params.id as string, req.body);
    return successResponse(res, 200, 'Project berhasil diperbarui', project);
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    await projectService.deleteProject(req.params.id as string);
    return successResponse(res, 200, 'Project berhasil dihapus');
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }
}

export async function submitProject(req: AuthRequest, res: Response) {
  try {
    const project = await projectService.submitProject(req.params.id as string, req.user!.userId);
    return successResponse(res, 200, 'Project berhasil disubmit', { status: project.status });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errorCode: 'PROJECT_SUBMIT_ERROR',
    });
  }
}

export async function validateProject(req: AuthRequest, res: Response) {
  const { status, notes } = req.body;

  if (!['VALIDATED', 'REJECTED', 'REVISION'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Status validasi tidak valid. Harus VALIDATED, REJECTED, atau REVISION',
      errorCode: 'INVALID_STATUS',
    });
  }

  try {
    const project = await projectService.validateProject(req.params.id as string, req.user!.userId, { status, notes });
    return successResponse(res, 200, 'Project berhasil divalidasi', { status: project.status });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errorCode: 'PROJECT_VALIDATE_ERROR',
    });
  }
}

export async function getValidation(req: Request, res: Response) {
  const project = await projectService.getProjectDetail(req.params.id as string);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project tidak ditemukan',
      errorCode: 'PROJECT_NOT_FOUND',
    });
  }
  return successResponse(res, 200, 'Hasil validasi project', project.validationSummary);
}
