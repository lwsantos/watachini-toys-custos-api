import { v4 as uuidv4 } from 'uuid';
import { Filament, FilamentPurchase, FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IFilamentPurchaseRepository } from '../../../domain/repositories/IFilamentPurchaseRepository';
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
    private filamentPurchaseRepository: IFilamentPurchaseRepository
  ) {}

  async execute(dto: RegisterFilamentPurchaseDTO): Promise<RegisterFilamentPurchaseResultDTO> {
    this.validateRequiredFields(dto);

    const quantity = dto.quantity;
    const totalPurchaseCost = this.calculateTotalPurchaseCost(dto);
    const unitCost = this.calculateUnitCost(dto);
    const costPerGram = Math.round((unitCost / 1000) * 100) / 100;

    const purchaseId = uuidv4();
    const now = new Date();
    const purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : now;

    const purchase = new FilamentPurchase({
      id: purchaseId,
      price: dto.price,
      quantity: dto.quantity,
      discount: dto.discount ?? 0,
      freight: dto.freight ?? 0,
      manufacturer: dto.manufacturer ?? '',
      purchaseLocation: dto.purchaseLocation ?? '',
      color: dto.color,
      filamentType: dto.filamentType,
      totalCost: totalPurchaseCost,
      purchaseDate,
      createdAt: now,
    });

    await this.filamentPurchaseRepository.create(purchase);

    const filamentIds: string[] = [];
    for (let i = 0; i < quantity; i++) {
      const filamentId = uuidv4();
      filamentIds.push(filamentId);

      const filament = new Filament({
        id: filamentId,
        purchaseId,
        color: dto.color,
        filamentType: dto.filamentType,
        manufacturer: dto.manufacturer ?? '',
        costPerGram,
        totalCost: unitCost,
        status: FilamentStatus.AVAILABLE,
        purchaseDate,
        createdAt: now,
      });

      await this.filamentRepository.create(filament);
    }

    return {
      purchaseId,
      filamentId: filamentIds[0],
      totalCost: unitCost,
      costPerGram,
    };
  }

  private validateRequiredFields(dto: RegisterFilamentPurchaseDTO): void {
    const missingFields: string[] = [];

    if (dto.price === undefined || dto.price === null) {
      missingFields.push('price');
    }

    if (dto.quantity === undefined || dto.quantity === null || dto.quantity < 1) {
      missingFields.push('quantity');
    }

    if (!dto.color || dto.color.trim() === '') {
      missingFields.push('color');
    }

    if (!dto.filamentType || dto.filamentType.trim() === '') {
      missingFields.push('filamentType');
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Calcula o custo total da compra (todos os itens)
   */
  private calculateTotalPurchaseCost(dto: RegisterFilamentPurchaseDTO): number {
    const price = dto.price;
    const discount = dto.discount ?? 0;
    const freight = dto.freight ?? 0;

    return (price - discount) + freight;
  }

  /**
   * Calcula o custo unitário de cada filamento
   * O preço já é unitário, mas desconto e frete são divididos pela quantidade
   */
  private calculateUnitCost(dto: RegisterFilamentPurchaseDTO): number {
    const price = dto.price;
    const quantity = dto.quantity;
    const discount = dto.discount ?? 0;
    const freight = dto.freight ?? 0;

    const discountPerUnit = discount / quantity;
    const freightPerUnit = freight / quantity;

    return (price - discountPerUnit) + freightPerUnit;
  }
}
