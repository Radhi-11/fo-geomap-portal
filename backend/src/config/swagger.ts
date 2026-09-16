import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from '../config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FO Geomap Portal API',
      version: '1.0.0',
      description: 'Backend API for Fiber Optic Project Verification and Validation',
    },
    servers: [
      { url: `http://localhost:${config.port}/api`, description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/modules/*/  *.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
