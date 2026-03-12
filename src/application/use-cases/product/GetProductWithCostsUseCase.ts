import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import {
  GetProductResultDTO,
  PartCostBreakdownDTO,
  FilamentCostInfoDTO,
  FilamentCharacteristicsDTO,
} from '../../dtos/GetProductDTO';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Use case for fetching a product with all parts and detailed cost breakdown
 * Validates: Requirements 5.4
 */
export class GetProductWithCostsUseCase {
  constructor(private productRepository: IProductRepository) {}

  async execute(productId: string): Promise<GetProductResultDTO> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError(`Produto não encontrado: ${productId}`);
    }

    const partsBreakdown: PartCostBreakdownDTO[] = product.parts.map((part) => {
      const filaments: FilamentCostInfoDTO[] = part.filaments.map((filament) => ({
        id: filament.id,
        color: filament.color,
        filamentType: filament.filamentType,
        manufacturer: filament.manufacturer,
        costPerGram: filament.costPerGram,
      }));

      const filamentCharacteristics: FilamentCharacteristicsDTO[] = part.partFilaments.map((pf) => ({
        filamentType: pf.filamentType,
        manufacturer: pf.manufacturer,
        color: pf.color,
      }));

      return {
        partId: part.id,
        name: part.name,
        weightGrams: part.weightGrams,
        printTimeHours: part.printTimeHours,
        filaments,
        filamentCharacteristics,
        costs: {
          filamentCost: part.filamentCost,
          energyCost: part.energyCost,
          maintenanceCost: part.maintenanceCost,
          totalCost: part.totalCost,
        },
        configurationSnapshot: {
          filamentCostPerGram: part.usedFilamentCostPerGram,
          energyCostPerHour: part.usedEnergyCostPerHour,
          maintenanceCostPerHour: part.usedMaintenanceCostPerHour,
        },
      };
    });

    return {
      productId: product.id,
      name: product.name,
      description: product.description,
      laborTimeMinutes: product.laborTimeMinutes ?? 0,
      parts: partsBreakdown,
      totalCost: product.totalCost,
      profitMargin: product.profitMargin,
      finalPrice: product.finalPrice,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
