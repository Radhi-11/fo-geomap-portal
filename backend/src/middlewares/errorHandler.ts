import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  errorCode?: string;
  isOperational?: boolean;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const isOperational = err.isOperational ?? (statusCode < 500);

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!isOperational && process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server internal',
      errorCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong',
    errorCode,
  });
}
