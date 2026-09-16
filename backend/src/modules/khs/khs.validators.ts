import { z } from 'zod';

export const createKhsItemSchema = z.object({
  khsVersion: z.string().default('v1.0'),
  itemCode: z.string().min(1, 'Kode item wajib diisi'),
  itemName: z.string().min(1, 'Nama item wajib diisi'),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  referencePrice: z.number().positive('Harga acuan harus lebih dari 0'),
  effectiveDate: z.string().optional(),
});

export const updateKhsItemSchema = createKhsItemSchema.partial();
