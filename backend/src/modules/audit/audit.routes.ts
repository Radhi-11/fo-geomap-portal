import { Router } from 'express';
import { getAuditLogs, getProjectAuditLogs } from './audit.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), getAuditLogs);
router.get('/project/:projectId', authenticate, authorize('ADMIN', 'VALIDATOR'), getProjectAuditLogs);

export default router;
