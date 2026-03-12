import {
  CalculateFinalPriceUseCase,
  NotFoundError,
  ValidationError,
  CalculateFinalPriceDTO,
} from './CalculateFinalPriceUseCase';
import { Product, ProductPart } from '../../../domain/entities';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';

describe('CalculateFinalPriceUseCase', () => {
  let useCase: CalculateFinalPriceUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new CalculateFinalPriceUseCase(mockProductRepository);
  });

  const createTestProduct = (overrides: Partial<Product> = {}): Product => {
    return new Product({
      id: 'product-1',
      name: 'Test Product',
      description: 'A test product',
      parts: [],
      totalCost: 100,
      profitMargin: 0,
      finalPrice: 100,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      ...overrides,
    });
  };

  describe('Product Not Found', () => {
    it('should throw NotFoundError when product does not exist', async () => {
      mockProductRepository.findById.mockResolvedValue(null);

      const dto: CalculateFinalPriceDTO = {
        productId: 'non-existent-id',
        profitMarginPercent: 30,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Produto não encontrado: non-existent-id'
      );
    });
  });

  describe('Validation', () => {
    it('should throw ValidationError when profit margin is negative', async () => {
      const product = createTestProduct();
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: -10,
      };

      await expect(useCase.execute(dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute(dto)).rejects.toThrow(
        'Margem de lucro deve ser não-negativa'
      );
    });

    it('should accept zero profit margin', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 0,
      };

      const result = await useCase.execute(dto);

      expect(result.finalPrice).toBe(100);
    });
  });

  describe('Final Price Calculation', () => {
    it('should calculate final price with 30% profit margin', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
      };

      const result = await useCase.execute(dto);

      // finalPrice = 100 * (1 + 30/100) = 100 * 1.3 = 130
      expect(result.finalPrice).toBe(130);
      expect(result.totalCost).toBe(100);
      expect(result.profitMarginPercent).toBe(30);
    });

    it('should calculate final price with 50% profit margin', async () => {
      const product = createTestProduct({ totalCost: 200 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 50,
      };

      const result = await useCase.execute(dto);

      // finalPrice = 200 * (1 + 50/100) = 200 * 1.5 = 300
      expect(result.finalPrice).toBe(300);
    });

    it('should calculate final price with 100% profit margin', async () => {
      const product = createTestProduct({ totalCost: 50 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 100,
      };

      const result = await useCase.execute(dto);

      // finalPrice = 50 * (1 + 100/100) = 50 * 2 = 100
      expect(result.finalPrice).toBe(100);
    });

    it('should handle decimal profit margins', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 15.5,
      };

      const result = await useCase.execute(dto);

      // finalPrice = ceil(100 * (1 + 15.5/100)) = ceil(100 * 1.155) = ceil(115.5) = 116
      expect(result.finalPrice).toBe(116);
    });
  });

  describe('Result DTO', () => {
    it('should return complete result DTO', async () => {
      const product = createTestProduct({
        id: 'product-123',
        name: 'My Product',
        totalCost: 80,
      });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-123',
        profitMarginPercent: 25,
      };

      const result = await useCase.execute(dto);

      expect(result.productId).toBe('product-123');
      expect(result.productName).toBe('My Product');
      expect(result.totalCost).toBe(80);
      expect(result.profitMarginPercent).toBe(25);
      expect(result.finalPrice).toBe(100); // 80 * 1.25
      expect(result.persisted).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should not persist changes by default', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
      };

      const result = await useCase.execute(dto);

      expect(result.persisted).toBe(false);
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });

    it('should not persist changes when persistChanges is false', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
        persistChanges: false,
      };

      const result = await useCase.execute(dto);

      expect(result.persisted).toBe(false);
      expect(mockProductRepository.update).not.toHaveBeenCalled();
    });

    it('should persist changes when persistChanges is true', async () => {
      const product = createTestProduct({ totalCost: 100 });
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.update.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
        persistChanges: true,
      };

      const result = await useCase.execute(dto);

      expect(result.persisted).toBe(true);
      expect(mockProductRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should update product with new margin and final price when persisting', async () => {
      const product = createTestProduct({
        totalCost: 100,
        profitMargin: 0,
        finalPrice: 100,
      });
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.update.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
        persistChanges: true,
      };

      await useCase.execute(dto);

      expect(mockProductRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          profitMargin: 30,
          finalPrice: 130,
        })
      );
    });

    it('should update updatedAt timestamp when persisting', async () => {
      const originalDate = new Date('2024-01-01');
      const product = createTestProduct({
        totalCost: 100,
        updatedAt: originalDate,
      });
      mockProductRepository.findById.mockResolvedValue(product);
      mockProductRepository.update.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'product-1',
        profitMarginPercent: 30,
        persistChanges: true,
      };

      await useCase.execute(dto);

      expect(mockProductRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );

      const updatedProduct = mockProductRepository.update.mock.calls[0][0];
      expect(updatedProduct.updatedAt.getTime()).toBeGreaterThan(originalDate.getTime());
    });
  });

  describe('Repository Interaction', () => {
    it('should call findById with the correct product ID', async () => {
      const product = createTestProduct();
      mockProductRepository.findById.mockResolvedValue(product);

      const dto: CalculateFinalPriceDTO = {
        productId: 'test-product-id',
        profitMarginPercent: 20,
      };

      await useCase.execute(dto);

      expect(mockProductRepository.findById).toHaveBeenCalledWith('test-product-id');
      expect(mockProductRepository.findById).toHaveBeenCalledTimes(1);
    });
  });
});
