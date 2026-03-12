import { FilamentCharacteristicsDTO } from './CreateProductDTO';

// Re-export for convenience
export { FilamentCharacteristicsDTO };

/**
 * DTO for filament information in cost breakdown
 */
export interface FilamentCostInfoDTO {
  id: string;
  color: string;
  filamentType: string;
  manufacturer: string;
  costPerGram: number;
}

/**
 * DTO for detailed cost breakdown of a product part
 */
export interface PartCostBreakdownDTO {
  partId: string;
  name: string;
  weightGrams: number;
  printTimeHours: number;
  filaments: FilamentCostInfoDTO[];
  filamentCharacteristics: FilamentCharacteristicsDTO[];
  costs: {
    filamentCost: number;
    energyCost: number;
    maintenanceCost: number;
    totalCost: number;
  };
  configurationSnapshot: {
    filamentCostPerGram: number;
    energyCostPerHour: number;
    maintenanceCostPerHour: number;
  };
}

/**
 * DTO for product with detailed cost breakdown
 * Validates: Requirements 5.4
 */
export interface GetProductResultDTO {
  productId: string;
  name: string;
  description: string;
  laborTimeMinutes: number;
  parts: PartCostBreakdownDTO[];
  totalCost: number;
  profitMargin: number;
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
