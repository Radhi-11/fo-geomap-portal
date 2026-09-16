import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  kmz: ['.kmz', '.kml'],
  boq: ['.xlsx', '.xls'],
  khs: ['.xlsx', '.xls'],
  report: ['.pdf', '.xlsx', '.html'],
};

const MIME_TYPES: Record<string, string[]> = {
  kmz: ['application/vnd.google-earth.kmz', 'application/kml', 'application/xml', 'text/xml'],
  boq: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  khs: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  report: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/html'],
};

export function fileUpload(fieldName: string, fileType: 'kmz' | 'boq' | 'khs' | 'report') {
  const allowedExts = ALLOWED_EXTENSIONS[fileType];
  const allowedMimes = MIME_TYPES[fileType];

  const storage = multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb: Function) => {
      const dir = path.join(config.upload.uploadDir, fileType === 'kmz' ? 'kmz' : fileType === 'boq' ? 'boq' : fileType === 'khs' ? 'khs' : 'reports');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
      const ext = path.extname(file.originalname);
      const storedName = `${randomUUID()}${ext}`;
      cb(null, storedName);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: any) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExts.includes(ext)) {
        return cb(new Error(`Ekstensi file tidak didukung. Gunakan: ${allowedExts.join(', ')}`), false);
      }

      if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
        logger.warn(`MIME type mismatch: expected ${allowedMimes.join(', ')}, got ${file.mimetype}`);
      }

      file.mimetype = file.mimetype || 'application/octet-stream';
      cb(null, true);
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: `File terlalu besar. Maksimal ${config.upload.maxFileSizeMB}MB`,
          errorCode: 'FILE_TOO_LARGE',
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          errorCode: 'FILE_UPLOAD_ERROR',
        });
      }
      next();
    });
  };
}

export interface UploadField {
  name: string;
  fileType: 'kmz' | 'boq' | 'khs' | 'report';
}

export function multiFileUpload(fields: UploadField[]) {
  const storage = multer.diskStorage({
    destination: (req: Request, _file: Express.Multer.File, cb: Function) => {
      const field = fields.find((f) => f.name === _file.fieldname);
      const type = field ? field.fileType : 'report';
      const dir = path.join(config.upload.uploadDir, type);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: any) => {
      const field = fields.find((f) => f.name === file.fieldname);
      if (field) {
        const allowedExts = ALLOWED_EXTENSIONS[field.fileType];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExts.includes(ext)) {
          return cb(new Error(`Ekstensi file tidak didukung untuk ${file.fieldname}. Gunakan: ${allowedExts.join(', ')}`), false);
        }
      }
      cb(null, true);
    },
  });

  const fieldConfigs = fields.map((f) => ({ name: f.name, maxCount: 1 }));

  return (req: Request, res: Response, next: NextFunction) => {
    upload.fields(fieldConfigs)(req, res, (err: any) => {
      if (err && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: `File terlalu besar. Maksimal ${config.upload.maxFileSizeMB}MB`,
          errorCode: 'FILE_TOO_LARGE',
        });
      }
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          errorCode: 'FILE_UPLOAD_ERROR',
        });
      }
      next();
    });
  };
}
