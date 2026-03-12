import { UpdateProductUseCase, ValidationError, BusinessError } from './UpdateProductUseCase';
import {
  Product,
  ProductPart,
  Filament,
  FilamentStatus,
  CostConfiguration,
} from '../../../domain/entities';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { UpdateProductDTO } from '../../dtos/UpdateProductDTO';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockFilamentRepository: jest.Mocked<IFilamentRepository>;
  let mockCostConfigurationRepository: jest.Mocked<ICostConfigurationRepository>;

  const mockConfig = new CostConfiguration({
    id: 'config-1',
    energyCostPerKwh: 0.5,
    printerPowerKwh: 0.2,
    laborCostPerHour: 10,
    maintenanceCostPerHour: 2,
    updatedAt: new Date(),
  });

  const createMockFilament = (
    id: string,
    costPerGram: number,
    type = 'PLA',
    manufacturer = 'Test',
    color = 'Red'
  ): Filament => {
    return new Filament({
      id,
      purchaseId: 'purchase-1',
      color,
      filamentType: type,
      manufacturer,
      costPerGram,
      totalCost: costPerGram * 1000,
      status: FilamentStatus.AVAILABLE,
      purchaseDate: new Date(),
      createdAt: new Date(),
    });
  };

  const createMockProduct = (id: string): Product => {
    const filament = createMockFilament('filament-1', 0.05);
    const part = new ProductPart({
      id: 'part-1',
      productId: id,
      name: 'Test Part',
      weightGrams: 100,
      printTimeHours: 2,
      filaments: [filament],
      filamentCost: 5,
      energyCost: 0.2, // 2 hours * 0.2 kWh * 0.5 $/kWh = 0.2
      maintenanceCost: 4, // 2 hours * 2 $/hour = 4
      totalCost: 9.2, // 5 + 0.2 + 4 = 9.2
      usedFilamentCostPerGram: 0.05,
      usedEnergyCostPerHour: 0.1, // 0.2 kWh * 0.5 $/kWh
      usedMaintenanceCostPerHour: 2,
      createdAt: new Date(),
    });

    return new Product({
      id,
      name: 'Test Product',
      description: 'Test Description',
      laborTimeMinutes: 0,
      parts: [part],
      totalCost: 9.2,
      profitMargin: 20,
      finalPrice: 12, // ceil(9.2 * 1.2) = 12
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  beforeEach(() => {
    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockFilamentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAvailableByColorAndType: jest.fn(),
      findAllAvailable: jest.fn(),
      updateStatus: jest.fn(),
      findOldestAvailable: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      findAvailableByCharacteristics: jest.fn(),
      getUniqueAvailableCharacteristics: jest.fn(),
    };

    mockCostConfigurationRepository = {
      get: jest.fn().mockResolvedValue(mockConfig),
      update: jest.fn(),
    };

    useCase = new UpdateProductUseCase(
      mockProductRepository,
      mockFilamentRepository,
      mockCostConfigurationRepository
    );
  });

  describe('execute', () => {
    it('should throw BusinessError when product does not exist', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const dto: UpdateProductDTO = { name: 'Updated Name' };

      await expect(useCase.execute('non-existent-id', dto)).rejects.toThrow(BusinessError);
      await expect(useCase.execute('non-existent-id', dto)).rejects.toThrow(
        'Produto não encontrado: non-existent-id'
      );
    });

    it('should update product name only', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      const dto: UpdateProductDTO = { name: 'Updated Name' };

      const result = await useCase.execute('product-1', dto);

      expect(result.productId).toBe('product-1');
      expect(result.name).toBe('Updated Name');
      expect(result.totalCost).toBe(9.2);
      expect(mockProductRepository.update).toHaveBeenCalled();
    });

    it('should update product description only', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      const dto: UpdateProductDTO = { description: 'Updated Description' };

      const result = await useCase.execute('product-1', dto);

      expect(result.productId).toBe('product-1');
      expect(result.name).toBe('Test Product');
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated Description' })
      );
    });

    it('should throw ValidationError when updating with empty parts array', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);

      const dto: UpdateProductDTO = { parts: [] };

      await expect(useCase.execute('product-1', dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('product-1', dto)).rejects.toThrow(
        'Produto deve ter pelo menos uma parte'
      );
    });

    it('should throw ValidationError when part has no filament characteristics', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'New Part',
            weightGrams: 50,
            printTimeHours: 1,
            filamentCharacteristics: [],
          },
        ],
      };

      await expect(useCase.execute('product-1', dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('product-1', dto)).rejects.toThrow(
        'Parte "New Part" deve ter pelo menos um filamento selecionado'
      );
    });

    it('should throw ValidationError when filament characteristics are invalid', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'New Part',
            weightGrams: 50,
            printTimeHours: 1,
            filamentCharacteristics: [
              {
                filamentType: 'PLA',
                manufacturer: '',
                color: 'Red',
              },
            ],
          },
        ],
      };

      await expect(useCase.execute('product-1', dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('product-1', dto)).rejects.toThrow(
        'Características de filamento inválidas: tipo, fabricante e cor são obrigatórios'
      );
    });

    it('should update product with new parts and recalculate costs using characteristics', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      const newFilament = createMockFilament('filament-new', 0.1, 'PLA', 'TestMfg', 'Blue');
      mockFilamentRepository.findAvailableByCharacteristics.mockResolvedValue([newFilament]);

      const dto: UpdateProductDTO = {
        name: 'Updated Product',
        parts: [
          {
            name: 'New Part',
            weightGrams: 200,
            printTimeHours: 3,
            filamentCharacteristics: [
              {
                filamentType: 'PLA',
                manufacturer: 'TestMfg',
                color: 'Blue',
              },
            ],
          },
        ],
      };

      const result = await useCase.execute('product-1', dto);

      expect(result.productId).toBe('product-1');
      expect(result.name).toBe('Updated Product');
      expect(result.parts).toHaveLength(1);
      expect(result.parts[0].name).toBe('New Part');

      // Verify cost calculations
      // filamentCost = 0.1 * 200 = 20
      // energyCost = 3 * 0.2 * 0.5 = 0.3
      // maintenanceCost = 3 * 2 = 6
      // partTotalCost = 20 + 0.3 + 6 = 26.3
      expect(result.parts[0].filamentCost).toBe(20);
      expect(result.parts[0].energyCost).toBeCloseTo(0.3, 2);
      expect(result.parts[0].maintenanceCost).toBe(6);
      expect(result.parts[0].totalCost).toBeCloseTo(26.3, 2);
      expect(result.totalCost).toBeCloseTo(26.3, 2);
    });

    it('should use zero cost when no filaments available for characteristics', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      // No filaments available for the characteristics
      mockFilamentRepository.findAvailableByCharacteristics.mockResolvedValue([]);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'New Part',
            weightGrams: 100,
            printTimeHours: 2,
            filamentCharacteristics: [
              {
                filamentType: 'ABS',
                manufacturer: 'Unknown',
                color: 'Green',
              },
            ],
          },
        ],
      };

      const result = await useCase.execute('product-1', dto);

      // filamentCost should be 0 when no filaments available
      expect(result.parts[0].filamentCost).toBe(0);
    });

    it('should update product with multiple parts using characteristics', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      const filament1 = createMockFilament('filament-1', 0.05, 'PLA', 'Mfg1', 'Red');
      const filament2 = createMockFilament('filament-2', 0.08, 'PETG', 'Mfg2', 'Blue');

      mockFilamentRepository.findAvailableByCharacteristics
        .mockResolvedValueOnce([filament1])
        .mockResolvedValueOnce([filament2]);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'Part 1',
            weightGrams: 100,
            printTimeHours: 2,
            filamentCharacteristics: [
              { filamentType: 'PLA', manufacturer: 'Mfg1', color: 'Red' },
            ],
          },
          {
            name: 'Part 2',
            weightGrams: 50,
            printTimeHours: 1,
            filamentCharacteristics: [
              { filamentType: 'PETG', manufacturer: 'Mfg2', color: 'Blue' },
            ],
          },
        ],
      };

      const result = await useCase.execute('product-1', dto);

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0].name).toBe('Part 1');
      expect(result.parts[1].name).toBe('Part 2');

      // Part 1: filament=5, energy=0.2, maintenance=4, total=9.2
      // Part 2: filament=4, energy=0.1, maintenance=2, total=6.1
      expect(result.parts[0].filamentCost).toBe(5);
      expect(result.parts[1].filamentCost).toBe(4);
      expect(result.totalCost).toBeCloseTo(9.2 + 6.1, 2);
    });

    it('should recalculate final price maintaining profit margin', async () => {
      const existingProduct = createMockProduct('product-1');
      existingProduct.profitMargin = 50; // 50% margin
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      const filament = createMockFilament('filament-1', 0.1, 'PLA', 'Test', 'Red');
      mockFilamentRepository.findAvailableByCharacteristics.mockResolvedValue([filament]);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'Part',
            weightGrams: 100,
            printTimeHours: 1,
            filamentCharacteristics: [
              { filamentType: 'PLA', manufacturer: 'Test', color: 'Red' },
            ],
          },
        ],
      };

      await useCase.execute('product-1', dto);

      // Verify that update was called with recalculated final price
      expect(mockProductRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          profitMargin: 50,
          // finalPrice should be ceil(totalCost * 1.5)
        })
      );
    });

    it('should calculate average cost when multiple filaments match characteristics', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.update.mockImplementation(async (p) => p);

      // Multiple filaments with same characteristics but different costs
      const filament1 = createMockFilament('f1', 0.1, 'PLA', 'Test', 'Red');
      const filament2 = createMockFilament('f2', 0.2, 'PLA', 'Test', 'Red');
      mockFilamentRepository.findAvailableByCharacteristics.mockResolvedValue([
        filament1,
        filament2,
      ]);

      const dto: UpdateProductDTO = {
        parts: [
          {
            name: 'Part',
            weightGrams: 100,
            printTimeHours: 1,
            filamentCharacteristics: [
              { filamentType: 'PLA', manufacturer: 'Test', color: 'Red' },
            ],
          },
        ],
      };

      const result = await useCase.execute('product-1', dto);

      // Average costPerGram = (0.1 + 0.2) / 2 = 0.15
      // filamentCost = 0.15 * 100 = 15
      expect(result.parts[0].filamentCost).toBeCloseTo(15, 2);
    });
  });
});
