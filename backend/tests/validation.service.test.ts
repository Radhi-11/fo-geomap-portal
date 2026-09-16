import { ValidationService } from '../src/modules/validation/validation.service';
import { KhsService } from '../src/modules/khs/khs.service';

jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    project: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lengthValidation: {
      create: jest.fn(),
    },
    priceValidation: {
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = require('../src/config/prisma').default;

const mockKhsService = {
  findByCode: jest.fn(),
};

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ValidationService(mockKhsService as unknown as KhsService);
  });

  describe('validateLength', () => {
    it('should return MATCH when difference is within tolerance', async () => {
      const projectId = 'proj-1';
      const kmzLengthKm = 1.0;
      const boqLengthMeters = 1000;

      const result = await service['validateLength'](projectId, kmzLengthKm, boqLengthMeters);

      expect(result.status).toBe('MATCH');
      expect(result.difference).toBe(0);
      expect(result.differencePercentage).toBe(0);
      expect(mockedPrisma.lengthValidation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId,
            status: 'MATCH',
          }),
        })
      );
    });

    it('should return NEED_REVIEW when difference exceeds tolerance but within 2x', async () => {
      const config = require('../src/config').config;
      const tolerance = config.validation.routeLengthTolerancePercent;
      const kmzLengthKm = 1.0;
      const boqLengthMeters = 1000 + 1000 * (tolerance * 1.5 / 100);

      const result = await service['validateLength']('proj-1', kmzLengthKm, boqLengthMeters);

      expect(result.status).toBe('NEED_REVIEW');
    });

    it('should return DIFFERENT when difference is very large', async () => {
      const projectId = 'proj-1';
      const kmzLengthKm = 1.0;
      const boqLengthMeters = 3000;

      const result = await service['validateLength'](projectId, kmzLengthKm, boqLengthMeters);

      expect(result.status).toBe('DIFFERENT');
      expect(result.differencePercentage).toBeGreaterThan(50);
    });
  });

  describe('validatePrices', () => {
    it('should return NOT_FOUND when KHS item does not exist', async () => {
      const boqItems = [
        { id: 'item-1', itemCode: 'TEST-001', unitPrice: 100000 },
      ];

      mockKhsService.findByCode.mockResolvedValue(null);

      const results = await service['validatePrices']('proj-1', boqItems);

      expect(results[0].status).toBe('NOT_FOUND');
      expect(results[0].khsPrice).toBeNull();
      expect(mockedPrisma.priceValidation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'NOT_FOUND',
            boqPrice: 100000,
          }),
        })
      );
    });

    it('should return MATCH when price equals KHS reference price', async () => {
      const boqItems = [
        { id: 'item-1', itemCode: 'TEST-001', unitPrice: 100000 },
      ];

      mockKhsService.findByCode.mockResolvedValue({
        id: 'khs-1',
        code: 'TEST-001',
        referencePrice: 100000,
      });

      const results = await service['validatePrices']('proj-1', boqItems);

      expect(results[0].status).toBe('MATCH');
      expect(results[0].difference).toBe(0);
    });

    it('should return DIFFERENT when price differs from KHS', async () => {
      const boqItems = [
        { id: 'item-1', itemCode: 'TEST-001', unitPrice: 150000 },
      ];

      mockKhsService.findByCode.mockResolvedValue({
        id: 'khs-1',
        code: 'TEST-001',
        referencePrice: 100000,
      });

      const results = await service['validatePrices']('proj-1', boqItems);

      expect(results[0].status).toBe('DIFFERENT');
      expect(results[0].difference).toBe(50000);
    });
  });

  describe('validateProject', () => {
    it('should throw error when project not found', async () => {
      mockedPrisma.project.findUnique.mockResolvedValue(null);

      await expect(service.validateProject('nonexistent')).rejects.toThrow('Project tidak ditemukan');
    });

    it('should run validation and update project', async () => {
      const mockProject = {
        id: 'proj-1',
        kmzRoute: { lengthKm: 1.0 },
        boqLength: 1000,
        boqItems: [],
      };

      mockedPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockedPrisma.project.update.mockResolvedValue({});

      const result = await service.validateProject('proj-1');

      expect(result.projectId).toBe('proj-1');
      expect(mockedPrisma.lengthValidation.create).toHaveBeenCalled();
    });
  });
});
