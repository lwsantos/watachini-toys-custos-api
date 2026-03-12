import { DeleteProductUseCase, BusinessError } from './DeleteProductUseCase';
import { Product, ProductPart, Filament, FilamentStatus } from '../../../domain/entities';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  const createMockFilament = (id: string, costPerGram: number): Filament => {
    return new Filament({
      id,
      purchaseId: 'purchase-1',
      color: 'Red',
      filamentType: 'PLA',
      manufacturer: 'Test',
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
      energyCost: 1,
      maintenanceCost: 4,
      totalCost: 10,
      usedFilamentCostPerGram: 0.05,
      usedEnergyCostPerHour: 0.5,
      usedMaintenanceCostPerHour: 2,
      createdAt: new Date(),
    });

    return new Product({
      id,
      name: 'Test Product',
      description: 'Test Description',
      laborTimeMinutes: 0,
      parts: [part],
      totalCost: 10,
      profitMargin: 20,
      finalPrice: 12,
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

    useCase = new DeleteProductUseCase(mockProductRepository);
  });

  describe('execute', () => {
    it('should throw BusinessError when product does not exist', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent-id')).rejects.toThrow(BusinessError);
      await expect(useCase.execute('non-existent-id')).rejects.toThrow(
        'Produto não encontrado: non-existent-id'
      );
    });

    it('should delete product when it exists', async () => {
      const existingProduct = createMockProduct('product-1');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);

      await useCase.execute('product-1');

      expect(mockProductRepository.findById).toHaveBeenCalledWith('product-1');
      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-1');
    });

    it('should call delete with correct product id', async () => {
      const existingProduct = createMockProduct('product-123');
      mockProductRepository.findById.mockResolvedValue(existingProduct);
      mockProductRepository.delete.mockResolvedValue(undefined);

      await useCase.execute('product-123');

      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-123');
      expect(mockProductRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should not call delete when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow(BusinessError);

      expect(mockProductRepository.delete).not.toHaveBeenCalled();
    });
  });
});
