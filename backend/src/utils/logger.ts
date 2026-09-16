import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    colorize(),
    logFormat,
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880 }),
    new transports.File({ filename: 'logs/combined.log', maxsize: 5242880 }),
  ],
});

export function logRequest(method: string, url: string, statusCode: number, duration: number): void {
  const status = statusCode >= 400 ? ` [ERROR]` : '';
  logger.info(`${method} ${url} ${statusCode} ${duration}ms${status}`);
}
