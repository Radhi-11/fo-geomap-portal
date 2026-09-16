import { Router } from 'express';
import { getDashboardSummary, getMonthlyStats } from './dashboard.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/summary', authenticate, authorize('ADMIN', 'VALIDATOR', 'VIEWER'), getDashboardSummary);
router.get('/monthly', authenticate, authorize('ADMIN', 'VALIDATOR', 'VIEWER'), getMonthlyStats);

export default router;
