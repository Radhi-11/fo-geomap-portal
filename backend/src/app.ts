import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger, logRequest } from './utils/logger';
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { setupSwagger } from './config/swagger';
import apiRoutes from './routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan, silakan coba lagi nanti',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api/', limiter);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req.method, req.originalUrl, res.statusCode, duration);
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'FO Geomap Portal API is running',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

setupSwagger(app);
app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
