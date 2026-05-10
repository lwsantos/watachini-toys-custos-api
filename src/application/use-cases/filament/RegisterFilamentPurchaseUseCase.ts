import { v4 as uuidv4 } from 'uuid';
import { Filament, Purchase, FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IPurchaseRepository } from '../../../domain/repositories/IPurchaseRepository';
import {
  RegisterFilamentPurchaseDTO,
  RegisterFilamentPurchaseResultDTO,
} from '../../dtos/RegisterFilamentPurchaseDTO';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RegisterFilamentPurchaseUseCase {
  constructor(
    private filamentRepository: IFilamentRepository,
    private purchaseRepository: IPurchaseRepository
  ) {}

  async execute(dto: RegisterFilamentPurchaseDTO): Promise<RegisterFilamentPurchaseResultDTO> {
    this.validateRequiredFields(dto);

    const lines = dto.lines;
    const totalSpools = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const totalDiscount = dto.discount ?? 0;
    const totalFreight = dto.freight ?? 0;
    const totalPurchaseCost = subtotal - totalDiscount + totalFreight;

    const discountPerSpool = totalDiscount / totalSpools;
    const freightPerSpool = totalFreight / totalSpools;

    const purchaseId = uuidv4();
    const now = new Date();
    const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : now;

    const purchase = new Purchase({
      id: purchaseId,
      price: subtotal,
      quantity: totalSpools,
      discount: totalDiscount,
      freight: totalFreight,
      totalCost: totalPurchaseCost,
      purchaseDate,
      purchaseLocation: dto.purchaseLocation ?? '',
      createdAt: now,
    });

    await this.purchaseRepository.create(purchase);

    const filamentIds: string[] = [];

    for (const line of lines) {
      const unitCostPerSpool = line.unitPrice - discountPerSpool + freightPerSpool;
      const costPerGram = Math.round((unitCostPerSpool / 1000) * 100) / 100;

      for (let i = 0; i < line.quantity; i++) {
        const filamentId = uuidv4();
        filamentIds.push(filamentId);

        const filament = new Filament({
          id: filamentId,
          purchaseId,
          color: line.color,
          filamentType: line.filamentType,
          manufacturer: line.manufacturer ?? '',
          unitPriceAtPurchase: line.unitPrice,
          costPerGram,
          totalCost: unitCostPerSpool,
          status: FilamentStatus.AVAILABLE,
          createdAt: now,
        });

        await this.filamentRepository.create(filament);
      }
    }

    const firstUnitCost =
      lines.length > 0
        ? lines[0].unitPrice - discountPerSpool + freightPerSpool
        : 0;
    const firstCostPerGram =
      lines.length > 0 ? Math.round((firstUnitCost / 1000) * 100) / 100 : 0;

    return {
      purchaseId,
      filamentIds,
      filamentId: filamentIds[0],
      totalCost: firstUnitCost,
      costPerGram: firstCostPerGram,
    };
  }

  private validateRequiredFields(dto: RegisterFilamentPurchaseDTO): void {
    const missingFields: string[] = [];

    if (!dto.lines || dto.lines.length === 0) {
      missingFields.push('lines');
    }

    if (dto.lines && dto.lines.length > 0) {
      dto.lines.forEach((line, index) => {
        const prefix = `lines[${index}]`;
        if (!line.color || line.color.trim() === '') {
          missingFields.push(`${prefix}.color`);
        }
        if (!line.filamentType || line.filamentType.trim() === '') {
          missingFields.push(`${prefix}.filamentType`);
        }
        if (line.quantity === undefined || line.quantity === null || line.quantity < 1) {
          missingFields.push(`${prefix}.quantity`);
        }
        if (line.unitPrice === undefined || line.unitPrice === null || line.unitPrice <= 0) {
          missingFields.push(`${prefix}.unitPrice`);
        }
      });
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`
      );
    }
  }
}
