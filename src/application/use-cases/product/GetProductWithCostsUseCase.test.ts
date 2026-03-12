import { GetProductWithCostsUseCase, NotFoundError } from './GetProductWithCostsUseCase';
import { Product, ProductPart, Filament, FilamentStatus } from '../../../domain/entities';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';

describe('GetProductWithCostsUseCase', () => {
  let useCase: GetProductWithCostsUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new GetProductWithCostsUseCase(mockProductRepository);
  });

  describe('Product Not Found', () => {
    it('should throw NotFoundError when product does not exist', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundError);
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        'Produto não encontrado: non-existent-id'
      );
    });
  });

  describe('Product with Parts and Costs', () => {
    it('should return product with detailed cost breakdown', async () => {
      const filament = new Filament({
        id: 'filament-1',
        color: 'Red',
        filamentType: 'PLA',
        manufacturer: 'TestBrand',
        costPerGram: 0.1,
        totalCost: 100,
        status: FilamentStatus.AVAILABLE,
        purchaseDate: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
      });

      const part = new ProductPart({
        id: 'part-1',
        productId: 'product-1',
        name: 'Base',
        weightGrams: 50,
        printTimeHours: 2,
        filaments: [filament],
        filamentCost: 5,
        energyCost: 2,
        maintenanceCost: 1,
        laborCost: 4,
        totalCost: 12,
        usedEnergyCostPerHour: 1,
        usedLaborCostPerHour: 2,
        usedMaintenanceCostPerHour: 0.5,
        createdAt: new Date('2024-01-15'),
      });

      const product = new Product({
        id: 'product-1',
        name: 'Test Product',
        description: 'A test product',
        parts: [part],
        totalCost: 12,
        profitMargin: 30,
        finalPrice: 15.6,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute('product-1');

      expect(result.productId).toBe('product-1');
      expect(result.name).toBe('Test Product');
      expect(result.description).toBe('A test product');
      expect(result.totalCost).toBe(12);
      expect(result.profitMargin).toBe(30);
      expect(result.finalPrice).toBe(15.6);
      expect(result.parts).toHaveLength(1);
    });

    it('should return part with all cost details', async () => {
      const filament = new Filament({
        id: 'filament-1',
        color: 'Blue',
        filamentType: 'PETG',
        manufacturer: 'BrandX',
        costPerGram: 0.15,
        totalCost: 150,
        status: FilamentStatus.AVAILABLE,
      });

      const part = new ProductPart({
        id: 'part-1',
        productId: 'product-1',
        name: 'Cover',
        weightGrams: 100,
        printTimeHours: 3,
        filaments: [filament],
        filamentCost: 15,
        energyCost: 3,
        maintenanceCost: 1.5,
        laborCost: 6,
        totalCost: 25.5,
        usedEnergyCostPerHour: 1,
        usedLaborCostPerHour: 2,
        usedMaintenanceCostPerHour: 0.5,
        createdAt: new Date(),
      });

      const product = new Product({
        id: 'product-1',
        name: 'Product',
        description: '',
        parts: [part],
        totalCost: 25.5,
        profitMargin: 0,
        finalPrice: 25.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute('product-1');
      const partResult = result.parts[0];

      expect(partResult.partId).toBe('part-1');
      expect(partResult.name).toBe('Cover');
      expect(partResult.weightGrams).toBe(100);
      expect(partResult.printTimeHours).toBe(3);
      expect(partResult.costs.filamentCost).toBe(15);
      expect(partResult.costs.energyCost).toBe(3);
      expect(partResult.costs.maintenanceCost).toBe(1.5);
      expect(partResult.costs.laborCost).toBe(6);
      expect(partResult.costs.totalCost).toBe(25.5);
    });

    it('should return filament information for each part', async () => {
      const filament1 = new Filament({
        id: 'filament-1',
        color: 'Red',
        filamentType: 'PLA',
        manufacturer: 'Brand1',
        costPerGram: 0.1,
      });

      const filament2 = new Filament({
        id: 'filament-2',
        color: 'White',
        filamentType: 'PLA',
        manufacturer: 'Brand2',
        costPerGram: 0.12,
      });

      const part = new ProductPart({
        id: 'part-1',
        productId: 'product-1',
        name: 'MultiColor Part',
        weightGrams: 80,
        printTimeHours: 2.5,
        filaments: [filament1, filament2],
        filamentCost: 8.8,
        energyCost: 2.5,
        maintenanceCost: 1.25,
        laborCost: 5,
        totalCost: 17.55,
        usedEnergyCostPerHour: 1,
        usedLaborCostPerHour: 2,
        usedMaintenanceCostPerHour: 0.5,
        createdAt: new Date(),
      });

      const product = new Product({
        id: 'product-1',
        name: 'MultiColor Product',
        description: '',
        parts: [part],
        totalCost: 17.55,
        profitMargin: 0,
        finalPrice: 17.55,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute('product-1');
      const partResult = result.parts[0];

      expect(partResult.filaments).toHaveLength(2);
      expect(partResult.filaments[0].id).toBe('filament-1');
      expect(partResult.filaments[0].color).toBe('Red');
      expect(partResult.filaments[0].filamentType).toBe('PLA');
      expect(partResult.filaments[0].manufacturer).toBe('Brand1');
      expect(partResult.filaments[0].costPerGram).toBe(0.1);
      expect(partResult.filaments[1].id).toBe('filament-2');
      expect(partResult.filaments[1].color).toBe('White');
    });

    it('should return configuration snapshot for each part', async () => {
      const part = new ProductPart({
        id: 'part-1',
        productId: 'product-1',
        name: 'Part',
        weightGrams: 50,
        printTimeHours: 1,
        filaments: [],
        filamentCost: 5,
        energyCost: 1.5,
        maintenanceCost: 0.75,
        laborCost: 3,
        totalCost: 10.25,
        usedEnergyCostPerHour: 1.5,
        usedLaborCostPerHour: 3,
        usedMaintenanceCostPerHour: 0.75,
        createdAt: new Date(),
      });

      const product = new Product({
        id: 'product-1',
        name: 'Product',
        description: '',
        parts: [part],
        totalCost: 10.25,
        profitMargin: 0,
        finalPrice: 10.25,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute('product-1');
      const partResult = result.parts[0];

      expect(partResult.configurationSnapshot.energyCostPerHour).toBe(1.5);
      expect(partResult.configurationSnapshot.laborCostPerHour).toBe(3);
      expect(partResult.configurationSnapshot.maintenanceCostPerHour).toBe(0.75);
    });
  });

  describe('Product with Multiple Parts', () => {
    it('should return all parts with their respective costs', async () => {
      const part1 = new ProductPart({
        id: 'part-1',
        productId: 'product-1',
        name: 'Part A',
        weightGrams: 30,
        printTimeHours: 1,
        filaments: [],
        filamentCost: 3,
        energyCost: 1,
        maintenanceCost: 0.5,
        laborCost: 2,
        totalCost: 6.5,
        usedEnergyCostPerHour: 1,
        usedLaborCostPerHour: 2,
        usedMaintenanceCostPerHour: 0.5,
        createdAt: new Date(),
      });

      const part2 = new ProductPart({
        id: 'part-2',
        productId: 'product-1',
        name: 'Part B',
        weightGrams: 70,
        printTimeHours: 2,
        filaments: [],
        filamentCost: 7,
        energyCost: 2,
        maintenanceCost: 1,
        laborCost: 4,
        totalCost: 14,
        usedEnergyCostPerHour: 1,
        usedLaborCostPerHour: 2,
        usedMaintenanceCostPerHour: 0.5,
        createdAt: new Date(),
      });

      const product = new Product({
        id: 'product-1',
        name: 'Multi-Part Product',
        description: 'Product with multiple parts',
        parts: [part1, part2],
        totalCost: 20.5,
        profitMargin: 25,
        finalPrice: 25.625,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      const result = await useCase.execute('product-1');

      expect(result.parts).toHaveLength(2);
      expect(result.parts[0].name).toBe('Part A');
      expect(result.parts[0].costs.totalCost).toBe(6.5);
      expect(result.parts[1].name).toBe('Part B');
      expect(result.parts[1].costs.totalCost).toBe(14);
      expect(result.totalCost).toBe(20.5);
    });
  });

  describe('Repository Interaction', () => {
    it('should call findById with the correct product ID', async () => {
      const product = new Product({
        id: 'test-id',
        name: 'Test',
        description: '',
        parts: [],
        totalCost: 0,
        profitMargin: 0,
        finalPrice: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockProductRepository.findById.mockResolvedValue(product);

      await useCase.execute('test-id');

      expect(mockProductRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
