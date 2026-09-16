# FO Geomap Portal - Backend API

Node.js/TypeScript backend for the Fiber Optic Geomap Portal, providing project verification, KMZ parsing, BoQ validation, and reporting APIs with PostgreSQL storage.

## Prerequisites

- Node.js >= 20
- npm
- PostgreSQL >= 16 (without PostGIS; uses JSONB for GeoJSON)

## Quick Start

### Option 1: Docker (Full Stack)

```bash
# Copy environment template
cp .env.example .env

# Start PostgreSQL and API together
docker-compose up --build

# In a separate terminal, run migrations and seed (first time only)
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run prisma:seed
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Set up PostgreSQL (local or via pgAdmin)
# Then configure DATABASE_URL in .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data
npm run prisma:seed

# Start development server
npm run dev

# Run tests
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration (index, prisma, swagger)
│   ├── middlewares/      # Auth, upload, validation middlewares
│   ├── routes/           # API route definitions
│   ├── modules/          # Feature modules
│   │   ├── auth/         # JWT authentication
│   │   ├── users/        # User management (admin CRUD)
│   │   ├── khs/          # KHS (reference prices) management
│   │   ├── projects/     # Project CRUD + workflow
│   │   ├── files/        # File upload & processing
│   │   ├── kmz/          # KMZ parsing engine
│   │   ├── boq/          # BoQ (Bill of Quantities) parser
│   │   ├── validation/   # Length & price validation engine
│   │   ├── geomap/       # GeoJSON map endpoints
│   │   ├── dashboard/    # Dashboard statistics
│   │   ├── reports/      # Project report generation (HTML/CSV/PDF)
│   │   └── audit/        # Audit logging
│   ├── utils/            # Helper utilities
│   └── types/            # TypeScript interfaces
├── prisma/
│   ├── schema.prisma     # Database schema (11 models)
│   └── seed.ts           # Seed script
├── tests/                # Jest test files
├── Dockerfile            # Production image
├── Dockerfile.dev        # Development image
├── Dockerfile.db         # PostgreSQL init image
└── docker-compose.yml
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | JWT access token secret |
| `JWT_REFRESH_SECRET` | — | JWT refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `MAX_FILE_SIZE_MB` | `20` | Max upload size |
| `UPLOAD_DIR` | `./storage` | File upload directory |
| `ROUTE_LENGTH_TOLERANCE_PERCENT` | `5` | KMZ-BoQ length match tolerance |
| `PRICE_TOLERANCE_PERCENT` | `0` | Price tolerance percentage |
| `PRICE_EXACT_MATCH` | `true` | Enable exact price matching |
| `NOMINATIM_USER_AGENT` | `FO-Geomap-Portal/1.0` | Nominatim API UA |
| `NOMINATIM_EMAIL` | `admin@portal.local` | Nominatim contact email |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

## Database Schema

The Prisma schema defines 11 models:

- **User**: 4 roles (ADMIN, VALIDATOR, VIEWER, TECHNICIAN) with `frontendRole` mapping
- **Project**: FO project with workflow status (DRAFT → SUBMITTED → PROCESSING → VALIDATED/REJECTED)
- **ProjectFile**: Uploaded KMZ and BoQ file records
- **KmzRoute**: Parsed route data (GeoJSON, length, bbox, start/end points)
- **BoqItem**: Items parsed from Excel (KHS_ prefixed codes)
- **PriceValidation**: Price comparison results (MATCH/DIFFERENT/NOT_FOUND)
- **LengthValidation**: Route length comparison results
- **KhsItem**: KHS reference price items
- **AuditLog**: Action audit trail

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/login` — Login with username/password → returns access + refresh tokens
- `POST /auth/refresh` — Refresh access token
- `POST /auth/change-password` — Change password

### Users
- `GET /users` — List users (admin only)
- `POST /users` — Create user (admin only)
- `GET /users/:id` — Get user details
- `PUT /users/:id` — Update user (admin only)
- `DELETE /users/:id` — Delete user (admin only)

### Projects
- `GET /projects` — List projects with filtering/pagination
- `POST /projects` — Create new project
- `GET /projects/:id` — Get project details (with route, BoQ items, validations)
- `PUT /projects/:id` — Update project
- `DELETE /projects/:id` — Delete project
- `POST /projects/:id/upload-kmz` — Upload & parse KMZ file
- `POST /projects/:id/upload-boq` — Upload & parse BoQ Excel file
- `POST /projects/:id/validate` — Run validation
- `POST /projects/:id/submit` — Submit for validation

### KHS
- `GET /khs` — List KHS items with search/pagination
- `POST /khs` — Create KHS item (admin only)
- `POST /khs/import` — Import KHS from Excel
- `GET /khs/categories` — Get KHS categories
- `GET /khs/:id` — Get KHS item details
- `PUT /khs/:id` — Update KHS item (admin only)
- `DELETE /khs/:id` — Delete KHS item (admin only)

### Geomap
- `GET /geomap/projects` — GeoJSON of all projects
- `GET /geomap/projects/:id` — GeoJSON of a single project
- `GET /geomap/provinces` — Province-level statistics

### Dashboard
- `GET /dashboard/summary` — Overall dashboard statistics
- `GET /dashboard/monthly` — Monthly statistics with optional `year`, `province`, `city` query params

### Reports
- `GET /reports/projects/:id` — HTML project report
- `GET /reports/projects/:id/pdf` — PDF project report
- `GET /reports/projects/:id/excel` — CSV project report

### Audit
- `GET /audit` — List audit logs
- `GET /audit/:id` — Get audit log details

### Health
- `GET /health` — Health check

## Roles & Permissions

| Role | Permissions |
|---|---|
| **ADMIN** | Full access; create/edit/delete all resources |
| **VALIDATOR** | Validate projects, view all, generate reports |
| **VIEWER** | Read-only access to projects and dashboard |
| **TECHNICIAN** | Create/edit own draft projects, upload files |

## Testing

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run with coverage
npx jest --coverage
```

## Docker Compose

The development `docker-compose.yml` includes:
- `db`: PostgreSQL 16 with health check
- `app`: Backend API with hot-reload volume mount
- `redis`: Redis for future caching/session storage

```bash
docker-compose up --build
docker-compose down
```

## License

 Proprietary - FO Geomap Portal
