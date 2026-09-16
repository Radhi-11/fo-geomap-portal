import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      const errors = err.errors?.map((e: any) => ({
        field: e.path?.join('.'),
        message: e.message,
      })) || [{ message: 'Validasi gagal' }];
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors,
      });
    }
  };
}
