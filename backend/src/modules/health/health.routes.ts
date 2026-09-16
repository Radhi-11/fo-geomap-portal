import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'FO Geomap Portal API is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

export default router;
