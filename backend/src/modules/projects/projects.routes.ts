import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  submitProject,
  validateProject,
  getValidation,
} from './projects.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { multiFileUpload } from '../../middlewares/upload';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize('TECHNICIAN', 'ADMIN', 'VALIDATOR'),
  multiFileUpload([{ name: 'kmzFile', fileType: 'kmz' }, { name: 'boqFile', fileType: 'boq' }]),
  createProject,
);

router.get('/', authenticate, authorize('ADMIN', 'VALIDATOR', 'TECHNICIAN', 'VIEWER'), listProjects);
router.get('/:id', authenticate, authorize('ADMIN', 'VALIDATOR', 'TECHNICIAN', 'VIEWER'), getProject);
router.put('/:id', authenticate, authorize('ADMIN', 'TECHNICIAN'), updateProject);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProject);
router.post('/:id/submit', authenticate, authorize('TECHNICIAN', 'ADMIN'), submitProject);
router.post('/:id/validate', authenticate, authorize('VALIDATOR', 'ADMIN'), validateProject);
router.get('/:id/validation', authenticate, authorize('ADMIN', 'VALIDATOR'), getValidation);

export default router;
