import * as XLSX from 'xlsx';
import { KhsRepository, ParsedKhsItem } from './khs.repository';
import { logger } from '../../utils/logger';

export class KhsService {
  private khsRepo = new KhsRepository();

  async importFromExcel(filePath: string, khsVersion: string = 'v1.0'): Promise<{
    imported: number;
    skipped: number;
    errors: any[];
  }> {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

    const items: ParsedKhsItem[] = [];

    for (const row of rawData) {
      const itemCode = row.ItemCode || row.Kode || row.productNo || row.ProductNo;
      if (!itemCode) {
        logger.warn(`Skip row: no itemCode found`, row);
        continue;
      }

      items.push({
        khsVersion,
        itemCode: String(itemCode),
        itemName: String(row.ItemName || row.ProductDesc || row.Deskripsi || 'Item Impor Excel'),
        unit: String(row.Unit || row.Satuan || 'Unit'),
        referencePrice: Number(row.ItemPrice || row.Harga || row.referencePrice || 0),
      });
    }

    return this.khsRepo.bulkUpsert(items);
  }

  async list(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    version?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { itemCode: { contains: params.search, mode: 'insensitive' } },
        { itemName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.version) {
      where.khsVersion = params.version;
    }

    if (params.category) {
      where.itemName = { ...where.itemName, contains: params.category, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.khsRepo.findAll(where, skip, limit),
      this.khsRepo.count(where),
    ]);

    return { items, total, page, limit };
  }

  async getItemById(id: string) {
    return this.khsRepo.findUnique({ id });
  }

  async createItem(data: ParsedKhsItem) {
    return this.khsRepo.create(data);
  }

  async updateItem(id: string, data: Partial<ParsedKhsItem>) {
    return this.khsRepo.update(id, data as any);
  }

  async deleteItem(id: string) {
    return this.khsRepo.delete(id);
  }

  async findByCode(itemCode: string, khsVersion?: string) {
    return this.khsRepo.findByCode(itemCode, khsVersion);
  }
}
