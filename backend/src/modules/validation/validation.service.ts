import prisma from '../../config/prisma';
import { KhsService } from '../khs/khs.service';
import { config } from '../../config';
import { ValidationStatus, ProjectStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

interface ValidationSummary {
  projectId: string;
  lengthValidation: {
    kmzLength: number;
    boqLength: number;
    difference: number;
    differencePercentage: number;
    tolerance: number;
    status: string;
    note?: string | null;
  } | null;
  priceValidation: {
    totalItems: number;
    matched: number;
    different: number;
    notFound: number;
    totalDifference: number;
  };
  overallStatus: string;
}

export class ValidationService {
  constructor(private khsService: KhsService) {}

  async validateProject(projectId: string): Promise<ValidationSummary> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { kmzRoute: true, boqItems: true },
    });

    if (!project) {
      throw new Error('Project tidak ditemukan');
    }

    let lengthResult = null;
    let priceResults: any[] = [];

    if (project.kmzRoute && project.boqLength) {
      lengthResult = await this.validateLength(projectId, project.kmzRoute.lengthKm || 0, project.boqLength);
    }

    if (project.boqItems && project.boqItems.length > 0) {
      priceResults = await this.validatePrices(projectId, project.boqItems);
    }

    const totalDifference = priceResults.reduce((sum, pv) => sum + (pv.difference || 0), 0);
    const matched = priceResults.filter(pv => pv.status === 'MATCH').length;
    const different = priceResults.filter(pv => pv.status === 'DIFFERENT').length;
    const notFound = priceResults.filter(pv => pv.status === 'NOT_FOUND').length;

    let overallStatus: string;
    if (lengthResult?.status !== 'MATCH' && lengthResult?.status !== 'NEED_REVIEW') {
      overallStatus = 'DIFFERENT';
    } else if (notFound > 0 || different > 0) {
      overallStatus = 'DIFFERENT';
    } else if (lengthResult?.status === 'NEED_REVIEW') {
      overallStatus = 'NEED_REVIEW';
    } else {
      overallStatus = 'MATCH';
    }

    let projectUpdate: any = {
      kmzLength: project.kmzRoute?.lengthKm || null,
      lengthDifference: lengthResult?.difference || null,
      lengthDiffPercentage: lengthResult?.differencePercentage || null,
      lengthValidationStatus: lengthResult?.status as any || null,
      khsTotalValue: 0,
      totalPriceDifference: totalDifference,
      priceValidationStatus: overallStatus === 'MATCH' ? 'MATCH' : 'DIFFERENT',
      overallStatus: overallStatus as any,
    };

    if (matched === priceResults.length && priceResults.length > 0) {
      projectUpdate.status = ProjectStatus.VALIDATED;
      projectUpdate.priceValidationStatus = ValidationStatus.MATCH;
    }

    await prisma.project.update({
      where: { id: projectId },
      data: projectUpdate,
    });

    return {
      projectId,
      lengthValidation: lengthResult,
      priceValidation: {
        totalItems: project.boqItems.length,
        matched,
        different,
        notFound,
        totalDifference,
      },
      overallStatus,
    };
  }

  private async validateLength(projectId: string, kmzLengthKm: number, boqLengthMeters: number) {
    const kmzLengthMeters = kmzLengthKm * 1000;
    const difference = Math.abs(kmzLengthMeters - boqLengthMeters);
    const differencePercentage = (difference / Math.max(kmzLengthMeters, boqLengthMeters)) * 100;
    const tolerance = config.validation.routeLengthTolerancePercent;

    let status: string;
    if (differencePercentage <= tolerance) {
      status = 'MATCH';
    } else if (differencePercentage <= tolerance * 2) {
      status = 'NEED_REVIEW';
    } else {
      status = 'DIFFERENT';
    }

    await prisma.lengthValidation.create({
      data: {
        projectId,
        kmzLength: kmzLengthMeters,
        boqLength: boqLengthMeters,
        difference,
        differencePercentage,
        tolerance,
        status: status as ValidationStatus,
      },
    });

    return {
      kmzLength: kmzLengthMeters,
      boqLength: boqLengthMeters,
      difference,
      differencePercentage: parseFloat(differencePercentage.toFixed(2)),
      tolerance,
      status,
    };
  }

  private async validatePrices(projectId: string, boqItems: any[]) {
    const results: any[] = [];

    for (const item of boqItems) {
      const khsItem = await this.khsService.findByCode(item.itemCode || '');

      let pvData: any = {
        projectId,
        boqItemId: item.id,
      };

      if (!khsItem) {
        pvData.status = 'NOT_FOUND';
        await prisma.priceValidation.create({
          data: {
            ...pvData,
            boqPrice: item.unitPrice,
          },
        });
        results.push({
          ...pvData,
          boqPrice: item.unitPrice,
          khsPrice: null,
          difference: null,
          differencePercentage: null,
          status: 'NOT_FOUND',
        });
      } else {
        const difference = item.unitPrice - khsItem.referencePrice;
        let status: string;

        if (config.validation.priceExactMatch) {
          status = Math.abs(difference) < 0.01 ? 'MATCH' : 'DIFFERENT';
        } else {
          const percentage = Math.abs(difference / khsItem.referencePrice) * 100;
          status = percentage <= config.validation.priceTolerancePercent ? 'MATCH' : 'DIFFERENT';
        }

        const differencePercentage = khsItem.referencePrice > 0
          ? (difference / khsItem.referencePrice) * 100
          : 0;

        await prisma.priceValidation.create({
          data: {
            projectId,
            boqItemId: item.id,
            khsItemId: khsItem.id,
            boqPrice: item.unitPrice,
            khsPrice: khsItem.referencePrice,
            difference,
            differencePercentage: parseFloat(differencePercentage.toFixed(2)),
            status: status as ValidationStatus,
          },
        });

        results.push({
          boqItemId: item.id,
          khsItemId: khsItem.id,
          boqPrice: item.unitPrice,
          khsPrice: khsItem.referencePrice,
          difference,
          differencePercentage: parseFloat(differencePercentage.toFixed(2)),
          status,
        });
      }
    }

    return results;
  }
}
