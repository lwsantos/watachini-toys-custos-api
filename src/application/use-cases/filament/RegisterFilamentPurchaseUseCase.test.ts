import { RegisterFilamentPurchaseUseCase, ValidationError } from './RegisterFilamentPurchaseUseCase';
import { RegisterFilamentPurchaseDTO } from '../../dtos/RegisterFilamentPurchaseDTO';
import { Filament, Purchase, FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IPurchaseRepository } from '../../../domain/repositories/IPurchaseRepository';

describe('RegisterFilamentPurchaseUseCase', () => {
  let useCase: RegisterFilamentPurchaseUseCase;
  let mockFilamentRepository: jest.Mocked<IFilamentRepository>;
  let mockPurchaseRepository: jest.Mocked<IPurchaseRepository>;

  beforeEach(() => {
    mockFilamentRepository = {
      create: jest.fn().mockImplementation((filament: Filament) => Promise.resolve(filament)),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAvailableByColorAndType: jest.fn(),
      findAllAvailable: jest.fn(),
      updateStatus: jest.fn(),
      update: jest.fn(),
      updateCostsForPurchase: jest.fn(),
      delete: jest.fn(),
      findOldestAvailable: jest.fn(),
      findByPurchaseId: jest.fn(),
      findAvailableByCharacteristics: jest.fn(),
      getUniqueAvailableCharacteristics: jest.fn(),
    };

    mockPurchaseRepository = {
      create: jest.fn().mockImplementation((purchase: Purchase) => Promise.resolve(purchase)),
      findById: jest.fn(),
      update: jest.fn(),
    };

    useCase = new RegisterFilamentPurchaseUseCase(mockFilamentRepository, mockPurchaseRepository);
  });

  describe('Validation', () => {
    it('should throw ValidationError when lines is empty', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [],
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Campos obrigatórios não preenchidos: lines');
    });

    it('should throw ValidationError when line color is missing', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [
          {
            color: '',
            filamentType: 'PLA',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Campos obrigatórios não preenchidos: lines[0].color'
      );
    });

    it('should throw ValidationError when line quantity is invalid', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [
          {
            color: 'Red',
            filamentType: 'PLA',
            quantity: 0,
            unitPrice: 100,
          },
        ],
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Campos obrigatórios não preenchidos: lines[0].quantity'
      );
    });
  });

  describe('Single line purchase', () => {
    it('should calculate purchase totalCost as subtotal - discount + freight', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [{ color: 'Red', filamentType: 'PLA', quantity: 1, unitPrice: 100 }],
        discount: 10,
        freight: 15,
      };

      const result = await useCase.execute(dto);

      expect(result.totalCost).toBe(105);
      expect(result.costPerGram).toBe(0.11);
      const createdPurchase = mockPurchaseRepository.create.mock.calls[0][0];
      expect(createdPurchase.totalCost).toBe(105);
      expect(createdPurchase.price).toBe(100);
      expect(createdPurchase.quantity).toBe(1);
    });

    it('should use 0 for discount and freight when not provided', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [{ color: 'Red', filamentType: 'PLA', quantity: 1, unitPrice: 100 }],
      };

      await useCase.execute(dto);
      const createdPurchase = mockPurchaseRepository.create.mock.calls[0][0];
      expect(createdPurchase.totalCost).toBe(100);
    });
  });

  describe('Multi-line purchase — split by total spool count', () => {
    it('should rate discount and freight per spool across lines', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [
          { color: 'Red', filamentType: 'PLA', quantity: 2, unitPrice: 50 },
          { color: 'Blue', filamentType: 'PETG', quantity: 1, unitPrice: 80 },
        ],
        discount: 30,
        freight: 12,
      };

      await useCase.execute(dto);

      const createdPurchase = mockPurchaseRepository.create.mock.calls[0][0];
      expect(createdPurchase.quantity).toBe(3);
      expect(createdPurchase.price).toBe(180);
      expect(createdPurchase.discount).toBe(30);
      expect(createdPurchase.freight).toBe(12);
      expect(createdPurchase.totalCost).toBe(162);

      expect(mockFilamentRepository.create).toHaveBeenCalledTimes(3);

      const discountPerSpool = 10;
      const freightPerSpool = 4;

      const plaUnit = 50 - discountPerSpool + freightPerSpool;
      const petgUnit = 80 - discountPerSpool + freightPerSpool;

      const calls = mockFilamentRepository.create.mock.calls.map((c) => c[0]);
      const plaRows = calls.filter((f) => f.filamentType === 'PLA');
      const petgRows = calls.filter((f) => f.filamentType === 'PETG');

      expect(plaRows.length).toBe(2);
      expect(petgRows.length).toBe(1);
      plaRows.forEach((f) => {
        expect(f.totalCost).toBe(plaUnit);
        expect(f.unitPriceAtPurchase).toBe(50);
      });
      expect(petgRows[0].totalCost).toBe(petgUnit);
      expect(petgRows[0].unitPriceAtPurchase).toBe(80);
    });
  });

  describe('Return value', () => {
    it('should return purchaseId, filamentIds, filamentId, totalCost, costPerGram', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [{ color: 'Red', filamentType: 'PLA', quantity: 2, unitPrice: 100 }],
      };

      const result = await useCase.execute(dto);

      expect(result.filamentIds).toHaveLength(2);
      expect(result.filamentId).toBe(result.filamentIds[0]);
      expect(result.purchaseId).toBeDefined();
      expect(typeof result.totalCost).toBe('number');
      expect(typeof result.costPerGram).toBe('number');
    });
  });

  describe('Entity creation', () => {
    it('should create Filaments with AVAILABLE status and unitPriceAtPurchase', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        lines: [{ color: 'Red', filamentType: 'PLA', quantity: 1, unitPrice: 100 }],
      };

      await useCase.execute(dto);

      const created = mockFilamentRepository.create.mock.calls[0][0];
      expect(created.status).toBe(FilamentStatus.AVAILABLE);
      expect(created.unitPriceAtPurchase).toBe(100);
    });
  });
});
