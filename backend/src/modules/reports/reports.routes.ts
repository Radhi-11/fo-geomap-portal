import { Router } from 'express';
import { getProjectReport, getProjectReportPdf, getProjectReportExcel } from './reports.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/projects/:id', authenticate, authorize('ADMIN', 'VALIDATOR'), getProjectReport);
router.get('/projects/:id/pdf', authenticate, authorize('ADMIN', 'VALIDATOR'), getProjectReportPdf);
router.get('/projects/:id/excel', authenticate, authorize('ADMIN', 'VALIDATOR'), getProjectReportExcel);

export default router;
