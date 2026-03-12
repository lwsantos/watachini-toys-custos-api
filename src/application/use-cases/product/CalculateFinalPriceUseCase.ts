import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { CostCalculationService } from '../../../domain/services/CostCalculationService';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * DTO for calculating final price
 */
export interface CalculateFinalPriceDTO {
  productId: string;
  profitMarginPercent: number;
  /** If true, updates the product with the new margin and final price */
  persistChanges?: boolean;
}

/**
 * DTO for the result of final price calculation
 */
export interface CalculateFinalPriceResultDTO {
  productId: string;
  productName: string;
  totalCost: number;
  profitMarginPercent: number;
  finalPrice: number;
  /** Indicates if the changes were persisted to the database */
  persisted: boolean;
}

/**
 * Use case for calculating the final price of a product with profit margin.
 * Supports real-time calculation (without persistence) and persistent updates.
 * 
 * Formula: finalPrice = totalCost * (1 + profitMarginPercent / 100)
 * 
 * Validates: Requirements 5.2, 5.3
 */
export class CalculateFinalPriceUseCase {
  private costCalculationService: CostCalculationService;

  constructor(private productRepository: IProductRepository) {
    this.costCalculationService = new CostCalculationService();
  }

  async execute(dto: CalculateFinalPriceDTO): Promise<CalculateFinalPriceResultDTO> {
    // Validate profit margin is non-negative
    this.validateProfitMargin(dto.profitMarginPercent);

    // Fetch product from repository
    const product = await this.productRepository.findById(dto.productId);

    if (!product) {
      throw new NotFoundError(`Produto não encontrado: ${dto.productId}`);
    }

    // Calculate final price using CostCalculationService
    const finalPrice = this.costCalculationService.calculateFinalPrice(
      product.totalCost,
      dto.profitMarginPercent
    );

    let persisted = false;

    // Optionally persist changes to the product
    if (dto.persistChanges) {
      product.profitMargin = dto.profitMarginPercent;
      product.finalPrice = finalPrice;
      product.updatedAt = new Date();
      
      await this.productRepository.update(product);
      persisted = true;
    }

    return {
      productId: product.id,
      productName: product.name,
      totalCost: product.totalCost,
      profitMarginPercent: dto.profitMarginPercent,
      finalPrice,
      persisted,
    };
  }

  /**
   * Validates that profit margin is non-negative.
   * Validates: Requirements 5.2 (VAL006)
   */
  private validateProfitMargin(profitMarginPercent: number): void {
    if (profitMarginPercent < 0) {
      throw new ValidationError('Margem de lucro deve ser não-negativa');
    }
  }
}
