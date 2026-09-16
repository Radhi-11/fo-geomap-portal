import { Request, Response } from 'express';
import { z } from 'zod';
import { getQueryParam, getQueryParamAsNumber } from '../../utils/reqQuery';
import { KhsService } from './khs.service';
import { createKhsItemSchema } from './khs.validators';
import { successResponse, paginatedResponse } from '../../utils/apiResponse';

const khsService = new KhsService();

export async function listKhs(req: Request, res: Response) {
  const result = await khsService.list({
    page: getQueryParamAsNumber(req, 'page', 1) || 1,
    limit: getQueryParamAsNumber(req, 'limit', 20) || 20,
    search: getQueryParam(req, 'search'),
    version: getQueryParam(req, 'version'),
  });

  return paginatedResponse(
    res, 200, 'Daftar item KHS berhasil diambil',
    result.items.map(item => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      unit: item.unit,
      referencePrice: item.referencePrice,
      itemCategory: item.itemName.toLowerCase().includes('material') ? 'MATERIAL' : 'SERVICE',
      khsVersion: item.khsVersion,
      effectiveDate: item.effectiveDate,
    })),
    result.page, result.limit, result.total,
  );
}

export async function createKhsItem(req: Request, res: Response) {
  const result = createKhsItemSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: result.error.issues.map(e => ({ field: e.path?.join('.') || '', message: e.message })),
    });
  }

  const item = await khsService.createItem(result.data);
  return successResponse(res, 201, 'Item KHS berhasil ditambahkan', {
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    unit: item.unit,
    referencePrice: item.referencePrice,
    khsVersion: item.khsVersion,
  });
}

export async function getKhsItem(req: Request, res: Response) {
  const id = req.params.id as string;
  const item = await khsService.getItemById(id);
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item KHS tidak ditemukan',
      errorCode: 'KHS_NOT_FOUND',
    });
  }
  return successResponse(res, 200, 'Detail item KHS', {
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    unit: item.unit,
    referencePrice: item.referencePrice,
    khsVersion: item.khsVersion,
  });
}

export async function updateKhsItem(req: Request, res: Response) {
  const id = req.params.id as string;
  const existing = await khsService.getItemById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Item KHS tidak ditemukan',
      errorCode: 'KHS_NOT_FOUND',
    });
  }

  const item = await khsService.updateItem(id, req.body);
  return successResponse(res, 200, 'Item KHS berhasil diperbarui', {
    id: item.id,
    itemCode: item.itemCode,
    itemName: item.itemName,
    unit: item.unit,
    referencePrice: item.referencePrice,
    khsVersion: item.khsVersion,
  });
}

export async function deleteKhsItem(req: Request, res: Response) {
  const id = req.params.id as string;
  const existing = await khsService.getItemById(id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: 'Item KHS tidak ditemukan',
      errorCode: 'KHS_NOT_FOUND',
    });
  }

  await khsService.deleteItem(id);
  return successResponse(res, 200, 'Item KHS berhasil dihapus');
}

export async function importKhsFromExcel(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'File Excel KHS wajib diupload',
      errorCode: 'FILE_REQUIRED',
    });
  }

  try {
    const result = await khsService.importFromExcel(req.file.path);
    return successResponse(res, 200, `Berhasil mengimpor ${result.imported} item KHS`, {
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses file Excel KHS',
      errorCode: 'KHS_IMPORT_ERROR',
    });
  }
}
