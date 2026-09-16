import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { successResponse } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';

export async function getGeomapProjects(req: Request, res: Response) {
  const status = req.query.status as string | undefined;
  const province = req.query.province as string | undefined;
  const city = req.query.city as string | undefined;

  const where: any = {};
  if (province) where.province = province;
  if (city) where.city = city;
  if (status) where.status = status;
  else where.status = 'VALIDATED';

  const projects = await prisma.project.findMany({
    where,
    include: { kmzRoute: true },
  });

  const features: any[] = [];

  for (const project of projects) {
    if (!project.kmzRoute?.geojson) continue;

    const geojson = project.kmzRoute.geojson as any;
    let geometry = geojson.geometry;
    let coordinates = geometry?.coordinates;

    features.push({
      type: 'Feature',
      geometry: {
        type: geometry?.type || 'LineString',
        coordinates: coordinates || [],
      },
      properties: {
        projectId: project.id,
        projectCode: project.projectCode,
        projectName: project.name,
        province: project.province || 'Indonesia',
        city: project.city || 'Tidak diketahui',
        projectValue: project.boqTotalValue || 0,
        validationStatus: project.overallStatus || 'PENDING',
      },
    });
  }

  return successResponse(res, 200, 'GeoJSON data berhasil diambil', {
    type: 'FeatureCollection',
    features,
  });
}
