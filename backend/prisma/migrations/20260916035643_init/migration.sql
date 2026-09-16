-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VALIDATOR', 'VIEWER', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PROCESSING', 'NEED_REVIEW', 'VALIDATED', 'REJECTED', 'REVISION');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('MATCH', 'DIFFERENT', 'NOT_FOUND', 'NEED_REVIEW');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('KMZ', 'BOQ', 'KHS', 'REPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "fullName" TEXT,
    "company" TEXT,
    "mustChangePw" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wo" TEXT,
    "technicianName" TEXT,
    "province" TEXT,
    "city" TEXT,
    "district" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "kmzLength" DOUBLE PRECISION,
    "boqLength" DOUBLE PRECISION,
    "lengthDifference" DOUBLE PRECISION,
    "lengthDiffPercentage" DOUBLE PRECISION,
    "lengthValidationStatus" "ValidationStatus",
    "boqTotalValue" DOUBLE PRECISION,
    "khsTotalValue" DOUBLE PRECISION,
    "totalPriceDifference" DOUBLE PRECISION,
    "priceValidationStatus" "ValidationStatus",
    "overallStatus" "ValidationStatus",
    "validatorNotes" TEXT,
    "technicianId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KmzRoute" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "geometry" JSONB,
    "geojson" JSONB,
    "lengthKm" DOUBLE PRECISION,
    "startLat" DOUBLE PRECISION,
    "startLng" DOUBLE PRECISION,
    "endLat" DOUBLE PRECISION,
    "endLng" DOUBLE PRECISION,
    "bbox" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KmzRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoqItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "itemCode" TEXT,
    "itemName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KhsItem" (
    "id" TEXT NOT NULL,
    "khsVersion" TEXT NOT NULL DEFAULT 'v1.0',
    "itemCode" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "referencePrice" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KhsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceValidation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "boqItemId" TEXT NOT NULL,
    "khsItemId" TEXT,
    "boqPrice" DOUBLE PRECISION NOT NULL,
    "khsPrice" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "differencePercentage" DOUBLE PRECISION,
    "status" "ValidationStatus" NOT NULL DEFAULT 'NOT_FOUND',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LengthValidation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kmzLength" DOUBLE PRECISION NOT NULL,
    "boqLength" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "differencePercentage" DOUBLE PRECISION NOT NULL,
    "tolerance" DOUBLE PRECISION NOT NULL,
    "status" "ValidationStatus" NOT NULL DEFAULT 'NEED_REVIEW',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LengthValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "oldStatus" "ProjectStatus",
    "newStatus" "ProjectStatus",
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_projectCode_key" ON "Project"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "KmzRoute_projectId_key" ON "KmzRoute"("projectId");

-- CreateIndex
CREATE INDEX "KhsItem_itemCode_idx" ON "KhsItem"("itemCode");

-- CreateIndex
CREATE INDEX "KhsItem_khsVersion_idx" ON "KhsItem"("khsVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KhsItem_khsVersion_itemCode_key" ON "KhsItem"("khsVersion", "itemCode");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_idx" ON "AuditLog"("projectId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KmzRoute" ADD CONSTRAINT "KmzRoute_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoqItem" ADD CONSTRAINT "BoqItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceValidation" ADD CONSTRAINT "PriceValidation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceValidation" ADD CONSTRAINT "PriceValidation_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "BoqItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceValidation" ADD CONSTRAINT "PriceValidation_khsItemId_fkey" FOREIGN KEY ("khsItemId") REFERENCES "KhsItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LengthValidation" ADD CONSTRAINT "LengthValidation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
