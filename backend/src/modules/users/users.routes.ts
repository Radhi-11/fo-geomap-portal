import { Router } from 'express';
import { listUsers, createUser, getUser, deleteUser } from './users.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), listUsers);
router.post('/', authenticate, authorize('ADMIN'), createUser);
router.get('/:id', authenticate, authorize('ADMIN'), getUser);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);

export default router;
