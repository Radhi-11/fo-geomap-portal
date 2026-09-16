import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
  logger.info(`📋 Health check: http://localhost:${config.port}/api/health`);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

export default server;
