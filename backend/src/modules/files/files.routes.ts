import { Router } from 'express';
import { downloadFile, listProjectFiles } from './files.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/:fileId', authenticate, authorize('ADMIN', 'VALIDATOR', 'TECHNICIAN'), downloadFile);
router.get('/project/:projectId', authenticate, authorize('ADMIN', 'VALIDATOR', 'TECHNICIAN'), listProjectFiles);

export default router;
