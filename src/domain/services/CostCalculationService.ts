import { Filament, Product, ProductPart, CostConfiguration } from '../entities';

export interface PartCostBreakdown {
  filamentCost: number;
  energyCost: number;
  maintenanceCost: number;
  laborCost: number;
  totalCost: number;
}

export interface ProductCostBreakdown {
  parts: { partId: string; partName: string; costs: PartCostBreakdown }[];
  totalCost: number;
}

export interface ICostCalculationService {
  calculateFilamentCostPerGram(filament: Filament): number;
  calculatePartFilamentCost(filaments: Filament[], weightGrams: number): number;
  calculatePartEnergyCost(printTimeHours: number, config: CostConfiguration): number;
  calculatePartMaintenanceCost(printTimeHours: number, config: CostConfiguration): number;
  calculatePartLaborCost(printTimeHours: number, config: CostConfiguration): number;
  calculatePartTotalCost(part: ProductPart, config: CostConfiguration): PartCostBreakdown;
  calculateProductTotalCost(product: Product, config: CostConfiguration): ProductCostBreakdown;
  calculateFinalPrice(totalCost: number, profitMarginPercent: number): number;
  calculateAverageCostPerGram(filaments: Filament[]): number;
  calculateFilamentCostFromAverage(avgCostPerGram: number, weightGrams: number): number;
}

export class CostCalculationService implements ICostCalculationService {
  /**
   * Calculates the cost per gram of a filament.
   * Formula: costPerGram = totalCost / 1000
   * Each filament has 1kg (1000 grams).
   * 
   * Validates: Requirements 2.1
   */
  calculateFilamentCostPerGram(filament: Filament): number {
    return filament.totalCost / 1000;
  }

  /**
   * Calculates the filament cost for a part.
   * For a single filament: costPerGram * weightGrams
   * For multiple filaments: average of costPerGram * weightGrams
   * 
   * Validates: Requirements 4.2, 4.3
   */
  calculatePartFilamentCost(filaments: Filament[], weightGrams: number): number {
    if (filaments.length === 0) {
      return 0;
    }

    const totalCostPerGram = filaments.reduce((sum, f) => sum + f.costPerGram, 0);
    const averageCostPerGram = totalCostPerGram / filaments.length;
    
    return averageCostPerGram * weightGrams;
  }

  /**
   * Calculates the energy cost for a part based on print time.
   * Formula: energyCost = printTimeHours * printerPowerKwh * energyCostPerKwh
   * 
   * Validates: Requirements 4.4
   */
  calculatePartEnergyCost(printTimeHours: number, config: CostConfiguration): number {
    return printTimeHours * config.printerPowerKwh * config.energyCostPerKwh;
  }

  /**
   * Calculates the maintenance cost for a part based on print time.
   * Formula: maintenanceCost = printTimeHours * config.maintenanceCostPerHour
   * 
   * Validates: Requirements 4.5
   */
  calculatePartMaintenanceCost(printTimeHours: number, config: CostConfiguration): number {
    return printTimeHours * config.maintenanceCostPerHour;
  }

  /**
   * Calculates the labor cost for a part based on print time.
   * Formula: laborCost = printTimeHours * config.laborCostPerHour
   * 
   * Validates: Requirements 4.6
   */
  calculatePartLaborCost(printTimeHours: number, config: CostConfiguration): number {
    return printTimeHours * config.laborCostPerHour;
  }

  /**
   * Calculates the total cost breakdown for a part.
   * Formula: totalCost = filamentCost + energyCost + maintenanceCost + laborCost
   * 
   * Validates: Requirements 4.7
   */
  calculatePartTotalCost(part: ProductPart, config: CostConfiguration): PartCostBreakdown {
    const filamentCost = this.calculatePartFilamentCost(part.filaments, part.weightGrams);
    const energyCost = this.calculatePartEnergyCost(part.printTimeHours, config);
    const maintenanceCost = this.calculatePartMaintenanceCost(part.printTimeHours, config);
    const laborCost = this.calculatePartLaborCost(part.printTimeHours, config);
    const totalCost = filamentCost + energyCost + maintenanceCost + laborCost;

    return {
      filamentCost,
      energyCost,
      maintenanceCost,
      laborCost,
      totalCost,
    };
  }

  /**
   * Calculates the total cost breakdown for a product.
   * Formula: productTotalCost = sum(parts.totalCost)
   * 
   * Validates: Requirements 5.1
   */
  calculateProductTotalCost(product: Product, config: CostConfiguration): ProductCostBreakdown {
    const partsBreakdown = product.parts.map((part) => {
      const costs = this.calculatePartTotalCost(part, config);
      return {
        partId: part.id,
        partName: part.name,
        costs,
      };
    });

    const totalCost = partsBreakdown.reduce((sum, p) => sum + p.costs.totalCost, 0);

    return {
      parts: partsBreakdown,
      totalCost,
    };
  }

  /**
   * Calculates the final price with profit margin.
   * Formula: finalPrice = ceil(totalCost * (1 + profitMarginPercent / 100))
   * Always rounds up to the nearest integer.
   * 
   * Validates: Requirements 5.2
   */
  calculateFinalPrice(totalCost: number, profitMarginPercent: number): number {
    const price = totalCost * (1 + profitMarginPercent / 100);
    return Math.ceil(price);
  }

  /**
   * Calcula a média do costPerGram de uma lista de filamentos.
   * Retorna 0 para lista vazia.
   * Arredonda para 2 casas decimais.
   * 
   * Validates: Requirements AC-2.2, AC-2.3
   */
  calculateAverageCostPerGram(filaments: Filament[]): number {
    if (filaments.length === 0) {
      return 0;
    }

    const totalCostPerGram = filaments.reduce((sum, f) => sum + f.costPerGram, 0);
    const average = totalCostPerGram / filaments.length;
    return Math.round(average * 100) / 100;
  }

  /**
   * Calcula o custo de filamento usando média de costPerGram.
   * Formula: avgCostPerGram * weightGrams
   * 
   * Validates: Requirements AC-2.4
   */
  calculateFilamentCostFromAverage(avgCostPerGram: number, weightGrams: number): number {
    return avgCostPerGram * weightGrams;
  }
}
