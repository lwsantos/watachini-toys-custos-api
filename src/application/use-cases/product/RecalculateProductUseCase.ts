import { Product, ProductPart, Filament } from '../../../domain/entities';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostCalculationService } from '../../../domain/services/CostCalculationService';

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export interface RecalculateProductPartResultDTO {
  partId: string;
  name: string;
  previousFilamentCost: number;
  newFilamentCost: number;
}

export interface RecalculateProductResultDTO {
  productId: string;
  name: string;
  previousTotalCost: number;
  newTotalCost: number;
  previousFinalPrice: number;
  newFinalPrice: number;
  parts: RecalculateProductPartResultDTO[];
}

/**
 * Use case for recalculating product costs based on current filament prices and configuration.
 * 
 * This use case:
 * 1. Fetches the existing product with parts and their partFilaments (characteristics)
 * 2. For each part, uses the stored characteristics to find current available filaments
 * 3. Calculates new average costPerGram from current filaments
 * 4. If no filaments available, keeps the existing snapshot value
 * 5. Recalculates all costs (filament, energy, maintenance) with current config
 * 6. Recalculates total cost and final price maintaining profit margin
 * 7. Returns comparison of previous vs new values
 * 
 * Validates: Requirements AC-4.2, AC-4.3
 */
export class RecalculateProductUseCase {
  private costCalculationService: CostCalculationService;

  constructor(
    private productRepository: IProductRepository,
    private filamentRepository: IFilamentRepository,
    private costConfigurationRepository: ICostConfigurationRepository
  ) {
    this.costCalculationService = new CostCalculationService();
  }

  async execute(productId: string): Promise<RecalculateProductResultDTO> {
    // Fetch existing product
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new BusinessError(`Produto não encontrado: ${productId}`);
    }

    // Store previous values for comparison
    const previousTotalCost = existingProduct.totalCost;
    const previousFinalPrice = existingProduct.finalPrice;

    // Get current cost configuration
    const config = await this.costConfigurationRepository.get();

    const now = new Date();
    const resultParts: RecalculateProductPartResultDTO[] = [];
    const updatedParts: ProductPart[] = [];

    // Process each part
    for (const part of existingProduct.parts) {
      const previousFilamentCost = part.filamentCost;

      // Fetch current filaments by characteristics stored in partFilaments
      const allFilaments: Filament[] = [];
      
      for (const partFilament of part.partFilaments) {
        const filaments = await this.filamentRepository.findAvailableByCharacteristics(
          partFilament.filamentType,
          partFilament.manufacturer,
          partFilament.color
        );
        allFilaments.push(...filaments);
      }

      // Calculate new average costPerGram
      // If no filaments available, keep the existing snapshot value (AC-2.3)
      let newAvgFilamentCostPerGram: number;
      if (allFilaments.length > 0) {
        newAvgFilamentCostPerGram = this.costCalculationService.calculateAverageCostPerGram(allFilaments);
      } else {
        // Keep existing snapshot value when no filaments available
        newAvgFilamentCostPerGram = part.usedFilamentCostPerGram;
      }

      // Calculate new filament cost
      const newFilamentCost = this.costCalculationService.calculateFilamentCostFromAverage(
        newAvgFilamentCostPerGram,
        part.weightGrams
      );

      // Recalculate energy and maintenance costs with current config
      const newEnergyCost = this.costCalculationService.calculatePartEnergyCost(
        part.printTimeHours,
        config
      );
      const newMaintenanceCost = this.costCalculationService.calculatePartMaintenanceCost(
        part.printTimeHours,
        config
      );

      // Calculate new part total cost
      const newPartTotalCost = newFilamentCost + newEnergyCost + newMaintenanceCost;

      // Create updated part with new costs
      const updatedPart = new ProductPart({
        id: part.id,
        productId: part.productId,
        name: part.name,
        weightGrams: part.weightGrams,
        printTimeHours: part.printTimeHours,
        filaments: allFilaments,
        partFilaments: part.partFilaments,
        filamentCost: newFilamentCost,
        energyCost: newEnergyCost,
        maintenanceCost: newMaintenanceCost,
        totalCost: newPartTotalCost,
        // Update configuration snapshot
        usedFilamentCostPerGram: newAvgFilamentCostPerGram,
        usedEnergyCostPerHour: config.printerPowerKwh * config.energyCostPerKwh,
        usedMaintenanceCostPerHour: config.maintenanceCostPerHour,
        createdAt: part.createdAt,
      });

      updatedParts.push(updatedPart);

      // Add to result parts for comparison
      resultParts.push({
        partId: part.id,
        name: part.name,
        previousFilamentCost,
        newFilamentCost,
      });
    }

    // Calculate new product total cost
    const partsTotalCost = updatedParts.reduce((sum, part) => sum + part.totalCost, 0);

    // Calculate product labor cost (based on laborTimeMinutes)
    const laborTimeHours = existingProduct.laborTimeMinutes / 60;
    const productLaborCost = laborTimeHours * config.laborCostPerHour;

    const newTotalCost = partsTotalCost + productLaborCost;

    // Recalculate final price maintaining profit margin (AC-4.3)
    const newFinalPrice = this.costCalculationService.calculateFinalPrice(
      newTotalCost,
      existingProduct.profitMargin
    );

    // Create updated product entity
    const updatedProduct = new Product({
      id: productId,
      name: existingProduct.name,
      description: existingProduct.description,
      laborTimeMinutes: existingProduct.laborTimeMinutes,
      parts: updatedParts,
      totalCost: newTotalCost,
      profitMargin: existingProduct.profitMargin,
      finalPrice: newFinalPrice,
      createdAt: existingProduct.createdAt,
      updatedAt: now,
    });

    // Save updated product to database
    await this.productRepository.update(updatedProduct);

    return {
      productId,
      name: existingProduct.name,
      previousTotalCost,
      newTotalCost,
      previousFinalPrice,
      newFinalPrice,
      parts: resultParts,
    };
  }
}
