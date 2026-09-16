import { Router } from 'express';
import { getGeomapProjects } from './geomap.controller';
import { authenticate, authorize } from '../../middlewares/auth';

const router = Router();

router.get('/', authenticate, authorize('ADMIN', 'VALIDATOR', 'VIEWER', 'TECHNICIAN'), getGeomapProjects);

export default router;
