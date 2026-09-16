import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
}

export const config = {
  env: getEnv('NODE_ENV', 'development'),
  port: parseInt(getEnv('PORT', '5000'), 10),
  databaseUrl: getEnv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/fo_portal?schema=public'),
  jwt: {
    accessSecret: getEnv('JWT_ACCESS_SECRET', 'change_this_access_secret_to_long_random_string'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET', 'change_this_refresh_secret_to_long_random_string'),
    accessExpiresIn: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  upload: {
    maxFileSizeMB: parseInt(getEnv('MAX_FILE_SIZE_MB', '20'), 10),
    uploadDir: getEnv('UPLOAD_DIR', './storage'),
  },
  validation: {
    routeLengthTolerancePercent: parseFloat(getEnv('ROUTE_LENGTH_TOLERANCE_PERCENT', '5')),
    priceTolerancePercent: parseFloat(getEnv('PRICE_TOLERANCE_PERCENT', '0')),
    priceExactMatch: getEnv('PRICE_EXACT_MATCH', 'true') === 'true',
  },
  geocoding: {
    userAgent: getEnv('NOMINATIM_USER_AGENT', 'FO-Geomap-Portal/1.0'),
    email: getEnv('NOMINATIM_EMAIL', 'admin@portal.local'),
  },
  rateLimit: {
    windowMs: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(getEnv('RATE_LIMIT_MAX', '100'), 10),
  },
  seed: {
    adminUsername: getEnv('SEED_ADMIN_USERNAME', 'admin'),
    adminPassword: getEnv('SEED_ADMIN_PASSWORD', 'admin123'),
    adminEmail: getEnv('SEED_ADMIN_EMAIL', 'admin@portal.local'),
  },
};
