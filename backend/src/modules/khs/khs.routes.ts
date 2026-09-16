import { Router } from 'express';
import { listKhs, createKhsItem, getKhsItem, updateKhsItem, deleteKhsItem, importKhsFromExcel } from './khs.controller';
import { authenticate, authorize } from '../../middlewares/auth';
import { fileUpload } from '../../middlewares/upload';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), listKhs);
router.post('/', authenticate, authorize('ADMIN'), createKhsItem);
router.get('/:id', authenticate, authorize('ADMIN', 'VALIDATOR'), getKhsItem);
router.put('/:id', authenticate, authorize('ADMIN'), updateKhsItem);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteKhsItem);
router.post('/import', authenticate, authorize('ADMIN'), fileUpload('khsFile', 'khs'), importKhsFromExcel);

export default router;
