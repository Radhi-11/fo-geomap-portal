import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import khsRoutes from '../modules/khs/khs.routes';
import projectRoutes from '../modules/projects/projects.routes';
import fileRoutes from '../modules/files/files.routes';
import geomapRoutes from '../modules/geomap/geomap.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import auditRoutes from '../modules/audit/audit.routes';
import healthRoutes from '../modules/health/health.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import { authenticate } from '../middlewares/auth';
import { successResponse } from '../utils/apiResponse';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/khs', khsRoutes);
router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
router.use('/geomap', geomapRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/audit', auditRoutes);
router.use('/health', healthRoutes);
router.use('/reports', reportsRoutes);

router.get('/', authenticate, (req, res) => {
  return successResponse(res, 200, 'FO Geomap Portal API', {
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects',
      khs: '/api/khs',
      files: '/api/files',
      dashboard: '/api/dashboard',
      geomap: '/api/geomap',
      reports: '/api/reports',
      audit: '/api/audit',
    },
  });
});

export default router;
