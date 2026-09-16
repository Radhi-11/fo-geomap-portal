import prisma from '../../config/prisma';
import { KhsItem } from '@prisma/client';

export interface ParsedKhsItem {
  khsVersion: string;
  itemCode: string;
  itemName: string;
  unit: string;
  referencePrice: number;
}

export class KhsRepository {
  async findAll(where: any = {}, skip = 0, take = 20): Promise<KhsItem[]> {
    return prisma.khsItem.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(where: any = {}): Promise<number> {
    return prisma.khsItem.count({ where });
  }

  async findByCode(itemCode: string, khsVersion?: string): Promise<KhsItem | null> {
    return prisma.khsItem.findFirst({
      where: { itemCode, ...(khsVersion ? { khsVersion } : {}) },
    });
  }

  async findUnique(where: any): Promise<KhsItem | null> {
    return prisma.khsItem.findUnique({ where });
  }

  async create(data: ParsedKhsItem): Promise<KhsItem> {
    return prisma.khsItem.create({ data });
  }

  async createMany(items: ParsedKhsItem[]): Promise<number> {
    const result = await prisma.khsItem.createMany({ data: items, skipDuplicates: true });
    return result.count;
  }

  async update(id: string, data: Partial<KhsItem>): Promise<KhsItem> {
    return prisma.khsItem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<KhsItem> {
    return prisma.khsItem.delete({ where: { id } });
  }

  async bulkUpsert(items: ParsedKhsItem[]): Promise<{ imported: number; skipped: number; errors: any[] }> {
    let imported = 0;
    let skipped = 0;
    const errors: any[] = [];

    for (const item of items) {
      try {
        await prisma.khsItem.upsert({
          where: { khsVersion_itemCode: { khsVersion: item.khsVersion, itemCode: item.itemCode } },
          update: {
            itemName: item.itemName,
            unit: item.unit,
            referencePrice: item.referencePrice,
            effectiveDate: new Date(),
          },
          create: {
            ...item,
            effectiveDate: new Date(),
          },
        });
        imported++;
      } catch (err) {
        errors.push({ itemCode: item.itemCode, error: err instanceof Error ? err.message : String(err) });
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }
}
