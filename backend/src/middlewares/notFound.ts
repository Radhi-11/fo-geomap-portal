import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response, next: NextFunction) {
  const error: any = new Error(`Route ${req.originalUrl} tidak ditemukan`);
  error.statusCode = 404;
  error.errorCode = 'NOT_FOUND';
  next(error);
}
