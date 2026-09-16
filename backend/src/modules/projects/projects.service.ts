import { Project, ProjectStatus, ValidationStatus, UserRole } from '@prisma/client';
import { KmzService } from '../kmz/kmz.service';
import { BoqService } from '../boq/boq.service';
import { KhsService } from '../khs/khs.service';
import { ValidationService } from '../validation/validation.service';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { formatIndonesianDate } from '../../utils/dateFormat';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';

import prisma from '../../config/prisma';

const kmzService = new KmzService();
const boqService = new BoqService();
const khsService = new KhsService();
const validationService = new ValidationService(khsService);

export interface ProjectDetail {
  id: string;
  projectCode: string;
  name: string;
  wo: string | null;
  technicianName: string | null;
  province: string | null;
  city: string | null;
  district: string | null;
  status: ProjectStatus;
  verificationStatus: string;
  kmzLength: number | null;
  boqLength: number | null;
  lengthDifference: number | null;
  lengthDiffPercentage: number | null;
  lengthValidationStatus: ValidationStatus | null;
  boqTotalValue: number | null;
  khsTotalValue: number | null;
  totalPriceDifference: number | null;
  priceValidationStatus: ValidationStatus | null;
  overallStatus: ValidationStatus | null;
  validatorNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  route: [number, number][] | null;
  boqItems: any[];
  kmzRoute: any | null;
  validationSummary: any | null;
  date: string;
}

export class ProjectService {
  private generateProjectCode(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `PRJ-${year}-${random}`;
  }

  private mapVerificationStatus(status: ProjectStatus): string {
    switch (status) {
      case 'VALIDATED': return 'VERIFIED';
      case 'NEED_REVIEW': return 'PENDING';
      case 'REVISION': return 'REVISION';
      case 'REJECTED': return 'REJECTED';
      case 'PROCESSING': return 'PENDING';
      case 'DRAFT':
      case 'SUBMITTED':
      default: return 'PENDING';
    }
  }

  async createProject(data: {
    projectName?: string;
    kmzFilePath?: string;
    boqFilePath?: string;
    technicianId?: string;
    technicianName?: string;
  }): Promise<any> {
    const projectCode = this.generateProjectCode();

    let kmzResult = null;
    let boqResult = null;
    let projectName = data.projectName || '';
    let province = 'Indonesia';
    let city = 'Lokasi Tidak Terdeteksi';

    try {
      if (data.kmzFilePath) {
        kmzResult = await kmzService.parseKmz(data.kmzFilePath);
        const midIndex = Math.floor(kmzResult.coordinates.length / 2);
        if (kmzResult.coordinates.length > 0) {
          const [lat, lng] = kmzResult.coordinates[midIndex];
          const geo = await kmzService.geocoding(lat, lng, config.geocoding.userAgent, config.geocoding.email);
          province = geo.province;
          city = geo.city;
        }
      }

      if (data.boqFilePath) {
        boqResult = await boqService.parseBoqExcel(data.boqFilePath);
        if (!projectName) projectName = boqResult.projectName;
      }

      const projectData: any = {
        projectCode,
        name: projectName,
        technicianName: data.technicianName,
        province,
        city,
        wo: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
        boqLength: boqResult?.lengthKm ? boqResult.lengthKm * 1000 : null,
        boqTotalValue: boqResult?.totalValue || 0,
        status: ProjectStatus.NEED_REVIEW,
        date: formatIndonesianDate(new Date()),
      };

      const project = await prisma.project.create({ data: projectData });

      if (kmzResult) {
        await prisma.kmzRoute.create({
          data: {
            projectId: project.id,
            geometry: kmzResult.geojson,
            geojson: kmzResult.geojson,
            lengthKm: kmzResult.lengthKm,
            startLat: kmzResult.startPoint.lat,
            startLng: kmzResult.startPoint.lng,
            endLat: kmzResult.endPoint.lat,
            endLng: kmzResult.endPoint.lng,
            bbox: kmzResult.bbox as any,
          },
        });
      }

      if (boqResult && boqResult.parsedItems.length > 0) {
        await prisma.boqItem.createMany({
          data: boqResult.parsedItems.map(item => ({
            projectId: project.id,
            itemCode: item.code,
            itemName: item.name,
            unit: item.unit,
            quantity: item.qty,
            unitPrice: item.submittedPrice,
            totalPrice: item.qty * item.submittedPrice,
          })),
        });
      }

      const validationResults = await validationService.validateProject(project.id);

      await this.logAudit(project.id, data.technicianId || '', 'PROJECT_CREATED', 'Project FO berhasil dibuat dan divalidasi');

      return this.mapProjectToDetail(project, kmzResult, boqResult, validationResults);
    } catch (err: any) {
      logger.error('Failed to create project:', err);
      if (data.projectName) {
        await prisma.project.create({
          data: {
            projectCode,
            name: data.projectName,
            technicianName: data.technicianName,
            status: ProjectStatus.DRAFT,
          },
        });
      }
      throw err;
    }
  }

  async listProjects(params: {
    page: number;
    limit: number;
    status?: string;
    province?: string;
    city?: string;
    search?: string;
    userId?: string;
    role?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.province) where.province = params.province;
    if (params.city) where.city = params.city;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { projectCode: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role === 'TECHNICIAN' && params.userId) {
      where.technicianId = params.userId;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, skip, take: params.limit, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where }),
    ]);

    const results = await Promise.all(
      projects.map(async (p: any) => {
        const kmzRoute = await prisma.kmzRoute.findUnique({ where: { projectId: p.id } });
        let route: [number, number][] | null = null;
        let kmzLengthKm: number | null = null;

        if (kmzRoute?.geojson) {
          const geojson = kmzRoute.geojson as any;
          if (geojson.geometry?.coordinates) {
            if (geojson.geometry.type === 'LineString') {
              route = geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
            } else if (geojson.geometry.type === 'Point') {
              route = [[geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]]];
            }
          }
          kmzLengthKm = kmzRoute.lengthKm;
        }

        return {
          id: p.id,
          projectCode: p.projectCode,
          name: p.name,
          wo: p.wo,
          technicianName: p.technicianName,
          province: p.province,
          city: p.city,
          district: p.district,
          status: p.status,
          verificationStatus: this.mapVerificationStatus(p.status),
          length: kmzLengthKm || p.kmzLength,
          boqLength: p.boqLength,
          value: p.boqTotalValue,
          date: formatIndonesianDate(p.createdAt),
        };
      }),
    );

    return { projects: results, total, page: params.page, limit: params.limit };
  }

  async getProjectDetail(id: string): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        kmzRoute: true,
        boqItems: true,
        priceValidations: { include: { khsItem: true, boqItem: true } },
        lengthValidations: true,
        files: { include: { uploadedBy: true } },
      },
    });

    if (!project) {
      return null;
    }

    let route: [number, number][] | null = null;
    if (project.kmzRoute?.geojson) {
      const geojson = project.kmzRoute.geojson as any;
      if (geojson.geometry?.coordinates) {
        if (geojson.geometry.type === 'LineString') {
          route = geojson.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        } else if (geojson.geometry.type === 'Point') {
          route = [[geojson.geometry.coordinates[1], geojson.geometry.coordinates[0]]];
        }
      }
    }

    const boqItemsWithValidation = project.boqItems.map((item: any) => {
      const validation = project.priceValidations.find((pv: any) => pv.boqItemId === item.id);
      return {
        code: item.itemCode,
        name: item.itemName,
        qty: item.quantity,
        unit: item.unit,
        submittedPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        priceValidation: validation
          ? {
              khsPrice: validation.khsPrice,
              difference: validation.difference,
              differencePercentage: validation.differencePercentage,
              status: validation.status,
              note: validation.note,
            }
          : null,
      };
    });

    const validationSummary = {
      lengthValidation: project.lengthValidations[0]
        ? {
            kmzLength: project.lengthValidations[0].kmzLength,
            boqLength: project.lengthValidations[0].boqLength,
            difference: project.lengthValidations[0].difference,
            differencePercentage: project.lengthValidations[0].differencePercentage,
            tolerance: project.lengthValidations[0].tolerance,
            status: project.lengthValidations[0].status,
          }
        : null,
      priceValidation: {
        totalItems: boqItemsWithValidation.length,
        matched: project.priceValidations.filter((pv: any) => pv.status === 'MATCH').length,
        different: project.priceValidations.filter((pv: any) => pv.status === 'DIFFERENT').length,
        notFound: project.priceValidations.filter((pv: any) => pv.status === 'NOT_FOUND').length,
        totalDifference: project.totalPriceDifference || 0,
      },
      overallStatus: project.overallStatus,
    };

    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      wo: project.wo,
      technicianName: project.technicianName,
      province: project.province,
      city: project.city,
      district: project.district,
      status: project.status,
      verificationStatus: this.mapVerificationStatus(project.status),
      kmzLength: project.kmzLength,
      boqLength: project.boqLength,
      lengthDifference: project.lengthDifference,
      lengthDiffPercentage: project.lengthDiffPercentage,
      lengthValidationStatus: project.lengthValidationStatus,
      boqTotalValue: project.boqTotalValue,
      khsTotalValue: project.khsTotalValue,
      totalPriceDifference: project.totalPriceDifference,
      priceValidationStatus: project.priceValidationStatus,
      overallStatus: project.overallStatus,
      validatorNotes: project.validatorNotes,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      route,
      boqItems: boqItemsWithValidation,
      kmzRoute: project.kmzRoute
        ? {
            lengthKm: project.kmzRoute.lengthKm,
            startPoint: { lat: project.kmzRoute.startLat, lng: project.kmzRoute.startLng },
            endPoint: { lat: project.kmzRoute.endLat, lng: project.kmzRoute.endLng },
            bbox: project.kmzRoute.bbox,
          }
        : null,
      validationSummary,
      date: formatIndonesianDate(project.createdAt),
    };
  }

  async updateProject(id: string, data: {
    name?: string;
    technicianName?: string;
    province?: string;
    city?: string;
  }): Promise<any> {
    return prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        technicianName: data.technicianName,
        province: data.province,
        city: data.city,
      },
    });
  }

  async deleteProject(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }

  async submitProject(id: string, userId: string): Promise<any> {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new Error('Project tidak ditemukan');
    }

    if (project.status !== ProjectStatus.DRAFT) {
      throw new Error(`Project tidak dapat disubmit dari status ${project.status}`);
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status: ProjectStatus.SUBMITTED },
    });

    await this.logAudit(id, userId, 'PROJECT_SUBMITTED', 'Project berhasil disubmit untuk validasi');

    return updated;
  }

  async validateProject(id: string, validatorId: string, data: {
    status: 'VALIDATED' | 'REJECTED' | 'REVISION';
    notes?: string;
  }): Promise<any> {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new Error('Project tidak ditemukan');
    }

    const oldStatus = project.status;
    await prisma.project.update({
      where: { id },
      data: {
        status: data.status as ProjectStatus,
        validatorNotes: data.notes,
      },
    });

    await this.logAudit(id, validatorId, 'PROJECT_VALIDATED', 
      `Status project diubah dari ${oldStatus} ke ${data.status}`,
      oldStatus, data.status as ProjectStatus,
    );

    return await prisma.project.findUnique({ where: { id } });
  }

  private async logAudit(projectId: string, userId: string, action: string, description?: string, oldStatus?: ProjectStatus, newStatus?: ProjectStatus) {
    await prisma.auditLog.create({
      data: {
        projectId,
        userId,
        action,
        description,
        oldStatus,
        newStatus,
      },
    });
  }

  private mapProjectToDetail(project: any, kmzResult: any, boqResult: any, validationResults: any) {
    let route: [number, number][] | null = null;
    if (kmzResult) {
      route = kmzResult.coordinates;
    }

    return {
      id: project.id,
      projectCode: project.projectCode,
      name: project.name,
      wo: project.wo,
      technicianName: project.technicianName,
      province: project.province,
      city: project.city,
      status: project.status,
      verificationStatus: this.mapVerificationStatus(project.status),
      kmzLength: kmzResult?.lengthKm,
      boqLength: boqResult?.lengthKm ? boqResult.lengthKm * 1000 : null,
      lengthDifference: validationResults?.lengthValidation?.difference || null,
      lengthDiffPercentage: validationResults?.lengthValidation?.differencePercentage || null,
      lengthValidationStatus: validationResults?.lengthValidation?.status || null,
      boqTotalValue: boqResult?.totalValue || 0,
      value: boqResult?.totalValue || 0,
      boqItems: (boqResult?.parsedItems || []).map((item: any) => ({
        code: item.code,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        submittedPrice: item.submittedPrice,
      })),
      route,
      date: formatIndonesianDate(new Date()),
      validationSummary: validationResults,
    };
  }
}
