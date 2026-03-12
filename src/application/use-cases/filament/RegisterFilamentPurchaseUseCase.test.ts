import { RegisterFilamentPurchaseUseCase, ValidationError } from './RegisterFilamentPurchaseUseCase';
import { RegisterFilamentPurchaseDTO } from '../../dtos/RegisterFilamentPurchaseDTO';
import { Filament, FilamentPurchase, FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IFilamentPurchaseRepository } from '../../../domain/repositories/IFilamentPurchaseRepository';

describe('RegisterFilamentPurchaseUseCase', () => {
  let useCase: RegisterFilamentPurchaseUseCase;
  let mockFilamentRepository: jest.Mocked<IFilamentRepository>;
  let mockFilamentPurchaseRepository: jest.Mocked<IFilamentPurchaseRepository>;

  beforeEach(() => {
    mockFilamentRepository = {
      create: jest.fn().mockImplementation((filament: Filament) => Promise.resolve(filament)),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAvailableByColorAndType: jest.fn(),
      findAllAvailable: jest.fn(),
      updateStatus: jest.fn(),
      findOldestAvailable: jest.fn(),
    };

    mockFilamentPurchaseRepository = {
      create: jest.fn().mockImplementation((purchase: FilamentPurchase) => Promise.resolve(purchase)),
      findById: jest.fn(),
    };

    useCase = new RegisterFilamentPurchaseUseCase(
      mockFilamentRepository,
      mockFilamentPurchaseRepository
    );
  });

  describe('Validation', () => {
    it('should throw ValidationError when price is missing', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: undefined as any,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Campos obrigatórios não preenchidos: price');
    });

    it('should throw ValidationError when quantity is missing', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: undefined as any,
        color: 'Red',
        filamentType: 'PLA',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Campos obrigatórios não preenchidos: quantity');
    });

    it('should throw ValidationError when color is missing', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: '',
        filamentType: 'PLA',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Campos obrigatórios não preenchidos: color');
    });

    it('should throw ValidationError when filamentType is missing', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: '',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow('Campos obrigatórios não preenchidos: filamentType');
    });

    it('should throw ValidationError listing all missing fields', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: undefined as any,
        quantity: undefined as any,
        color: '',
        filamentType: '',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Campos obrigatórios não preenchidos: price, quantity, color, filamentType'
      );
    });
  });

  describe('Total Cost Calculation', () => {
    it('should calculate totalCost as (price - discount) + freight', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        discount: 10,
        freight: 15,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      // totalCost = (100 - 10) + 15 = 105
      expect(result.totalCost).toBe(105);
    });

    it('should use 0 for discount when not provided', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        freight: 15,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      // totalCost = (100 - 0) + 15 = 115
      expect(result.totalCost).toBe(115);
    });

    it('should use 0 for freight when not provided', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        discount: 10,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      // totalCost = (100 - 10) + 0 = 90
      expect(result.totalCost).toBe(90);
    });

    it('should calculate totalCost correctly with no discount and no freight', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      // totalCost = (100 - 0) + 0 = 100
      expect(result.totalCost).toBe(100);
    });
  });

  describe('Cost Per Gram Calculation', () => {
    it('should calculate costPerGram as totalCost / 1000', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      // costPerGram = 100 / 1000 = 0.1
      expect(result.costPerGram).toBe(0.1);
    });

    it('should calculate costPerGram correctly with discount and freight', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 150,
        quantity: 1,
        discount: 20,
        freight: 30,
        color: 'Blue',
        filamentType: 'PETG',
      };

      const result = await useCase.execute(dto);

      // totalCost = (150 - 20) + 30 = 160
      // costPerGram = 160 / 1000 = 0.16
      expect(result.totalCost).toBe(160);
      expect(result.costPerGram).toBe(0.16);
    });
  });

  describe('Entity Creation', () => {
    it('should create FilamentPurchase with correct data', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        discount: 10,
        freight: 15,
        manufacturer: 'TestBrand',
        purchaseLocation: 'TestStore',
        color: 'Red',
        filamentType: 'PLA',
      };

      await useCase.execute(dto);

      expect(mockFilamentPurchaseRepository.create).toHaveBeenCalledTimes(1);
      const createdPurchase = mockFilamentPurchaseRepository.create.mock.calls[0][0];

      expect(createdPurchase.price).toBe(100);
      expect(createdPurchase.quantity).toBe(1);
      expect(createdPurchase.discount).toBe(10);
      expect(createdPurchase.freight).toBe(15);
      expect(createdPurchase.manufacturer).toBe('TestBrand');
      expect(createdPurchase.purchaseLocation).toBe('TestStore');
      expect(createdPurchase.color).toBe('Red');
      expect(createdPurchase.filamentType).toBe('PLA');
      expect(createdPurchase.totalCost).toBe(105);
    });

    it('should create Filament with AVAILABLE status', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      await useCase.execute(dto);

      expect(mockFilamentRepository.create).toHaveBeenCalledTimes(1);
      const createdFilament = mockFilamentRepository.create.mock.calls[0][0];

      expect(createdFilament.status).toBe(FilamentStatus.AVAILABLE);
    });

    it('should create Filament with correct costPerGram', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 200,
        quantity: 1,
        discount: 50,
        freight: 25,
        color: 'Green',
        filamentType: 'ABS',
      };

      await useCase.execute(dto);

      const createdFilament = mockFilamentRepository.create.mock.calls[0][0];

      // totalCost = (200 - 50) + 25 = 175
      // costPerGram = 175 / 1000 = 0.175
      expect(createdFilament.costPerGram).toBe(0.175);
      expect(createdFilament.totalCost).toBe(175);
    });

    it('should link Filament to FilamentPurchase via purchaseId', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      const createdFilament = mockFilamentRepository.create.mock.calls[0][0];
      expect(createdFilament.purchaseId).toBe(result.purchaseId);
    });
  });

  describe('Return Value', () => {
    it('should return purchaseId, filamentId, totalCost, and costPerGram', async () => {
      const dto: RegisterFilamentPurchaseDTO = {
        price: 100,
        quantity: 1,
        color: 'Red',
        filamentType: 'PLA',
      };

      const result = await useCase.execute(dto);

      expect(result).toHaveProperty('purchaseId');
      expect(result).toHaveProperty('filamentId');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('costPerGram');
      expect(typeof result.purchaseId).toBe('string');
      expect(typeof result.filamentId).toBe('string');
    });
  });
});
