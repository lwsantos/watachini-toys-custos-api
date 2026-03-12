import { v4 as uuidv4 } from 'uuid';
import { Product, ProductPart, Filament } from '../../../domain/entities';
import { PartFilament } from '../../../domain/entities/PartFilament';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostCalculationService } from '../../../domain/services/CostCalculationService';
import {
  UpdateProductDTO,
  UpdateProductResultDTO,
  UpdateProductPartDTO,
} from '../../dtos/UpdateProductDTO';
import { FilamentCharacteristicsDTO } from '../../dtos/CreateProductDTO';

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
  dto: UpdateProductPartDTO;
  filaments: Filament[];
  characteristics: FilamentCharacteristicsDTO[];
}

export class UpdateProductUseCase {
  private costCalculationService: CostCalculationService;

  constructor(
    private productRepository: IProductRepository,
    private filamentRepository: IFilamentRepository,
    private costConfigurationRepository: ICostConfigurationRepository
  ) {
    this.costCalculationService = new CostCalculationService();
  }

  async execute(productId: string, dto: UpdateProductDTO): Promise<UpdateProductResultDTO> {
    // Validate product exists
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new BusinessError(`Produto não encontrado: ${productId}`);
    }

    // If parts are being updated, validate at least one part
    if (dto.parts !== undefined) {
      this.validateProductHasParts(dto.parts);
      this.validatePartsHaveFilamentCharacteristics(dto.parts);
    }

    // Get current cost configuration
    const config = await this.costConfigurationRepository.get();

    const now = new Date();

    // Determine if we need to recalculate costs (parts changed)
    let productParts: ProductPart[];
    let partsTotalCost: number;
    let resultParts: UpdateProductResultDTO['parts'];

    if (dto.parts !== undefined) {
      // Fetch filaments by characteristics for all parts
      const partsWithFilaments = await this.fetchFilamentsByCharacteristics(dto.parts);

      // Create new product parts with calculated costs
      productParts = [];
      resultParts = [];

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
          // Store configuration snapshot (AC-3.4)
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

      // Calculate parts total cost
      partsTotalCost = productParts.reduce((sum, part) => sum + part.totalCost, 0);
    } else {
      // Keep existing parts and costs
      productParts = existingProduct.parts;
      partsTotalCost = existingProduct.parts.reduce((sum, part) => sum + part.totalCost, 0);
      resultParts = productParts.map((part) => ({
        partId: part.id,
        name: part.name,
        filamentCost: part.filamentCost,
        energyCost: part.energyCost,
        maintenanceCost: part.maintenanceCost,
        totalCost: part.totalCost,
      }));
    }

    // Calculate product labor cost (based on laborTimeMinutes)
    const laborTimeMinutes = dto.laborTimeMinutes ?? existingProduct.laborTimeMinutes ?? 0;
    const laborTimeHours = laborTimeMinutes / 60;
    const productLaborCost = laborTimeHours * config.laborCostPerHour;

    const productTotalCost = partsTotalCost + productLaborCost;

    // Recalculate final price with existing profit margin (AC-3.3)
    const finalPrice = this.costCalculationService.calculateFinalPrice(
      productTotalCost,
      existingProduct.profitMargin
    );

    // Create updated product entity
    const updatedProduct = new Product({
      id: productId,
      name: dto.name ?? existingProduct.name,
      description: dto.description ?? existingProduct.description,
      laborTimeMinutes,
      parts: productParts,
      totalCost: productTotalCost,
      profitMargin: existingProduct.profitMargin,
      finalPrice,
      createdAt: existingProduct.createdAt,
      updatedAt: now,
    });

    // Save updated product to database
    await this.productRepository.update(updatedProduct);

    return {
      productId,
      name: updatedProduct.name,
      totalCost: productTotalCost,
      laborCost: productLaborCost,
      parts: resultParts,
    };
  }

  private validateProductHasParts(parts: UpdateProductPartDTO[]): void {
    if (!parts || parts.length === 0) {
      throw new ValidationError('Produto deve ter pelo menos uma parte');
    }
  }

  private validatePartsHaveFilamentCharacteristics(parts: UpdateProductPartDTO[]): void {
    for (const partDto of parts) {
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
    parts: UpdateProductPartDTO[]
  ): Promise<PartWithFilamentData[]> {
    const result: PartWithFilamentData[] = [];

    for (const partDto of parts) {
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
