import { BoqService, BoqParseResult, BoqItem } from '../src/modules/boq/boq.service';

jest.mock('xlsx');
jest.mock('../src/config/prisma');

const mockXlsx = require('xlsx');

describe('BoqService', () => {
  let service: BoqService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BoqService();
  });

  describe('parseBoqExcel', () => {
    it('should parse XLSX and extract BoQ items with KHS_ prefix', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          'Sheet1': {},
        },
      };

      const mockJsonData: any[][] = [
        ['Kode Item', 'Nama', 'Qty', 'Satuan', 'Harga'],
        ['KHS_001', 'Kabel Serat Optik', 10, 'M', 50000],
        ['KHS_002', 'Konduktor', 5, 'M', 30000],
      ];

      mockXlsx.readFile.mockReturnValue(mockWorkbook);
      mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);

      const result = await service.parseBoqExcel('/fake/path.xlsx');

      expect(result.parsedItems).toHaveLength(2);
      expect(result.parsedItems[0].code).toBe('KHS_001');
      expect(result.parsedItems[0].name).toBe('Kabel Serat Optik');
      expect(result.parsedItems[0].qty).toBe(10);
      expect(result.parsedItems[0].unit).toBe('M');
      expect(result.parsedItems[0].submittedPrice).toBe(50000);
    });

    it('should extract project name from Nama Project row', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { 'Sheet1': {} },
      };

      const mockJsonData: any[][] = [
        ['Nama Project', 'Proyek Jalan Tol'],
        ['KHS_001', 'Material', 1, 'Unit', 10000],
      ];

      mockXlsx.readFile.mockReturnValue(mockWorkbook);
      mockXlsx.utils.sheet_to_json.mockReturnValue(mockJsonData);

      const result = await service.parseBoqExcel('/fake/path.xlsx');

      expect(result.projectName).toBe('Proyek Jalan Tol');
    });

    it('should handle empty workbook gracefully', async () => {
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { 'Sheet1': {} },
      };

      mockXlsx.readFile.mockReturnValue(mockWorkbook);
      mockXlsx.utils.sheet_to_json.mockReturnValue([[]]);

      const result = await service.parseBoqExcel('/fake/path.xlsx');

      expect(result.parsedItems).toHaveLength(0);
      expect(result.totalValue).toBe(0);
    });
  });
});
