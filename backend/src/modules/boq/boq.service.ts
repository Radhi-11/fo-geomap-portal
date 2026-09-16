import * as XLSX from 'xlsx';
import { logger } from '../../utils/logger';

export interface BoqItem {
  code: string;
  name: string;
  qty: number;
  unit: string;
  submittedPrice: number;
}

export interface BoqParseResult {
  projectName: string;
  lengthKm: number;
  totalValue: number;
  parsedItems: BoqItem[];
}

export class BoqService {
  async parseBoqExcel(filePath: string): Promise<BoqParseResult> {
    return new Promise((resolve, reject) => {
      try {
        const workbook = XLSX.readFile(filePath);
        const fileName = filePath.split(/[\/\\]/).pop() || 'unknown';

        let projectName = fileName.replace(/\.[^/.]+$/, '');
        let lengthKm = 0;
        let totalValue = 0;
        let parsedItems: BoqItem[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          for (let r = 0; r < jsonData.length; r++) {
            const row = jsonData[r];
            if (!row || !Array.isArray(row)) continue;

            for (let c = 0; c < row.length; c++) {
              const cell = row[c];
              if (!cell || typeof cell !== 'string') continue;

              const cellStr = cell.trim().toLowerCase();

              if (cellStr.includes('nama project') || cellStr.includes('nama pekerjaan')) {
                for (let i = c + 1; i < row.length; i++) {
                  if (row[i] && typeof row[i] === 'string' && row[i].trim().length > 2) {
                    projectName = row[i].trim();
                    break;
                  }
                }
              }

              if (cellStr.includes('panjang jalur') || cellStr.includes('panjang fo')) {
                for (let i = c + 1; i < row.length; i++) {
                  if (typeof row[i] === 'number') {
                    lengthKm = row[i];
                    break;
                  } else if (typeof row[i] === 'string') {
                    const parsed = parseFloat(row[i].replace(/[^\d.-]/g, ''));
                    if (!isNaN(parsed) && parsed > 0) {
                      lengthKm = parsed;
                      break;
                    }
                  }
                }
              }

              if (totalValue === 0 && (cellStr.includes('total harga') || cellStr === 'total' || cellStr.includes('grand total'))) {
                for (let i = c + 1; i < row.length; i++) {
                  if (typeof row[i] === 'number' && row[i] > 1000) {
                    totalValue = row[i];
                    break;
                  }
                }
              }

              if (cell.trim().toUpperCase().startsWith('KHS_')) {
                const code = cell.trim().toUpperCase();
                let name = 'Material / Jasa FO';
                let qty = 1;
                let unit = 'Unit';
                let price = 0;

                let foundName = false;
                let foundQty = false;
                let foundUnit = false;

                for (let i = c + 1; i < row.length; i++) {
                  const val = row[i];
                  if (val === undefined || val === null || val === '') continue;

                  if (!foundName && typeof val === 'string' && isNaN(Number(val))) {
                    name = val.trim();
                    foundName = true;
                  } else if (foundName && !foundQty && (typeof val === 'number' || !isNaN(Number(val)))) {
                    qty = Number(val);
                    foundQty = true;
                  } else if (foundQty && !foundUnit && typeof val === 'string') {
                    unit = val.trim();
                    foundUnit = true;
                  } else if (foundQty && (typeof val === 'number' || !isNaN(Number(val)))) {
                    price = Number(val);
                    break;
                  }
                }

                if (!parsedItems.find(p => p.code === code && p.qty === qty)) {
                  parsedItems.push({ code, name, qty, unit, submittedPrice: price });
                }
              }
            }
          }
        }

        if (lengthKm > 100) lengthKm = lengthKm / 1000;

        if (totalValue === 0 && parsedItems.length > 0) {
          totalValue = parsedItems.reduce((acc, curr) => acc + (curr.qty * curr.submittedPrice), 0);
        }

        resolve({ projectName, lengthKm, parsedItems, totalValue });
      } catch (error) {
        logger.error('Gagal memparsing BoQ Excel:', error);
        reject(error);
      }
    });
  }
}
