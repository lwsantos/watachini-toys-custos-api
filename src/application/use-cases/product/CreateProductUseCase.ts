import { v4 as uuidv4 } from 'uuid';
import { Product, ProductPart, Filament } from '../../../domain/entities';
import { PartFilament } from '../../../domain/entities/PartFilament';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostCalculationService } from '../../../domain/services/CostCalculationService';
import {
  CreateProductDTO,
  CreateProductResultDTO,
  FilamentCharacteristicsDTO,
} from '../../dtos/CreateProductDTO';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

interface PartWithFilamentData {
  dto: CreateProductDTO['parts'][0];
  filaments: Filament[];
  characteristics: FilamentCharacteristicsDTO[];
}

export class CreateProductUseCase {
  private costCalculationService: CostCalculationService;

  constructor(
    private productRepository: IProductRepository,
    private filamentRepository: IFilamentRepository,
    private costConfigurationRepository: ICostConfigurationRepository
  ) {
    this.costCalculationService = new CostCalculationService();
  }

  async execute(dto: CreateProductDTO): Promise<CreateProductResultDTO> {
    // Validate product has at least one part
    this.validateProductHasParts(dto);

    // Validate parts have filament characteristics
    this.validatePartsHaveFilamentCharacteristics(dto);

    // Get current cost configuration
    const config = await this.costConfigurationRepository.get();

    // Fetch filaments by characteristics for all parts
    const partsWithFilaments = await this.fetchFilamentsByCharacteristics(dto);

    const now = new Date();
    const productId = uuidv4();

    // Create product parts with calculated costs
    const productParts: ProductPart[] = [];
    const resultParts: CreateProductResultDTO['parts'] = [];

    for (const partData of partsWithFilaments) {
      const partId = uuidv4();

      // Calculate average costPerGram from all filaments found for all characteristics
      const avgFilamentCostPerGram = this.costCalculationService.calculateAverageCostPerGram(
        partData.filaments
      );

      // Calculate filament cost using average
      const filamentCost = this.costCalculationService.calculateFilamentCostFromAverage(
        avgFilamentCostPerGram,
        partData.dto.weightGrams
      );

      const energyCost = this.costCalculationService.calculatePartEnergyCost(
        partData.dto.printTimeHours,
        config
      );
      const maintenanceCost = this.costCalculationService.calculatePartMaintenanceCost(
        partData.dto.printTimeHours,
        config
      );
      // Labor cost is calculated at product level, not part level
      const partTotalCost = filamentCost + energyCost + maintenanceCost;

      // Create PartFilament entities for each characteristic
      const partFilaments: PartFilament[] = partData.characteristics.map((char) => {
        return new PartFilament({
          id: uuidv4(),
          partId,
          filamentType: char.filamentType,
          manufacturer: char.manufacturer,
          color: char.color,
          createdAt: now,
        });
      });

      const productPart = new ProductPart({
        id: partId,
        productId,
        name: partData.dto.name,
        weightGrams: partData.dto.weightGrams,
        printTimeHours: partData.dto.printTimeHours,
        filaments: partData.filaments,
        filamentCost,
        energyCost,
        maintenanceCost,
        totalCost: partTotalCost,
        // Store configuration snapshot
        usedFilamentCostPerGram: avgFilamentCostPerGram,
        usedEnergyCostPerHour: config.printerPowerKwh * config.energyCostPerKwh,
        usedMaintenanceCostPerHour: config.maintenanceCostPerHour,
        createdAt: now,
        partFilaments,
      });

      productParts.push(productPart);
      resultParts.push({
        partId,
        name: partData.dto.name,
        filamentCost,
        energyCost,
        maintenanceCost,
        totalCost: partTotalCost,
      });
    }

    // Calculate product total cost
    const partsTotalCost = productParts.reduce((sum, part) => sum + part.totalCost, 0);

    // Calculate product labor cost (based on laborTimeMinutes)
    const laborTimeMinutes = dto.laborTimeMinutes || 0;
    const laborTimeHours = laborTimeMinutes / 60;
    const productLaborCost = laborTimeHours * config.laborCostPerHour;

    const productTotalCost = partsTotalCost + productLaborCost;

    // Create product entity
    const product = new Product({
      id: productId,
      name: dto.name,
      description: dto.description ?? '',
      laborTimeMinutes,
      parts: productParts,
      totalCost: productTotalCost,
      profitMargin: 0,
      finalPrice: productTotalCost,
      createdAt: now,
      updatedAt: now,
    });

    // Save product to database
    await this.productRepository.create(product);

    return {
      productId,
      name: dto.name,
      totalCost: productTotalCost,
      laborCost: productLaborCost,
      parts: resultParts,
    };
  }

  private validateProductHasParts(dto: CreateProductDTO): void {
    if (!dto.parts || dto.parts.length === 0) {
      throw new ValidationError('Produto deve ter pelo menos uma parte');
    }
  }

  private validatePartsHaveFilamentCharacteristics(dto: CreateProductDTO): void {
    for (const partDto of dto.parts) {
      if (!partDto.filamentCharacteristics || partDto.filamentCharacteristics.length === 0) {
        throw new ValidationError(
          `Parte "${partDto.name}" deve ter pelo menos um filamento selecionado`
        );
      }

      // Validate each characteristic has required fields
      for (const char of partDto.filamentCharacteristics) {
        if (!char.filamentType || !char.manufacturer || !char.color) {
          throw new ValidationError(
            'Características de filamento inválidas: tipo, fabricante e cor são obrigatórios'
          );
        }
      }
    }
  }

  private async fetchFilamentsByCharacteristics(
    dto: CreateProductDTO
  ): Promise<PartWithFilamentData[]> {
    const result: PartWithFilamentData[] = [];

    for (const partDto of dto.parts) {
      const allFilaments: Filament[] = [];

      // Fetch filaments for each characteristic
      for (const char of partDto.filamentCharacteristics) {
        const filaments = await this.filamentRepository.findAvailableByCharacteristics(
          char.filamentType,
          char.manufacturer,
          char.color
        );
        allFilaments.push(...filaments);
      }

      // Note: If no filaments found, we use 0 as the costPerGram snapshot (AC-2.3)
      // This is handled by calculateAverageCostPerGram returning 0 for empty array

      result.push({
        dto: partDto,
        filaments: allFilaments,
        characteristics: partDto.filamentCharacteristics,
      });
    }

    return result;
  }
}
