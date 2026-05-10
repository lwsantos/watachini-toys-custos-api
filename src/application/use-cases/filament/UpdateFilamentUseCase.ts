import { Filament, Purchase } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IPurchaseRepository } from '../../../domain/repositories/IPurchaseRepository';
import { UpdateFilamentDTO, UpdateFilamentResultDTO } from '../../dtos/UpdateFilamentDTO';

export class FilamentNotFoundError extends Error {
  constructor(id: string) {
    super(`Filamento com ID ${id} não encontrado`);
    this.name = 'FilamentNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UpdateFilamentUseCase {
  constructor(
    private filamentRepository: IFilamentRepository,
    private purchaseRepository: IPurchaseRepository
  ) {}

  async execute(dto: UpdateFilamentDTO): Promise<UpdateFilamentResultDTO> {
    this.validateRequiredFields(dto);

    const filament = await this.filamentRepository.findById(dto.id);
    if (!filament) {
      throw new FilamentNotFoundError(dto.id);
    }

    const purchase = await this.purchaseRepository.findById(filament.purchaseId);
    if (!purchase) {
      throw new FilamentNotFoundError(dto.id);
    }

    const quantity = purchase.quantity;
    if (!quantity || quantity < 1) {
      throw new ValidationError('Quantidade da compra inválida');
    }

    const discount = dto.discount ?? 0;
    const freight = dto.freight ?? 0;
    const discountPerUnit = discount / quantity;
    const freightPerUnit = freight / quantity;
    const unitCatalogPrice = dto.price;
    const unitCost = unitCatalogPrice - discountPerUnit + freightPerUnit;
    const costPerGram = Math.round((unitCost / 1000) * 100) / 100;

    filament.color = dto.color;
    filament.filamentType = dto.filamentType;
    filament.manufacturer = dto.manufacturer ?? '';
    filament.unitPriceAtPurchase = unitCatalogPrice;
    filament.totalCost = unitCost;
    filament.costPerGram = costPerGram;

    purchase.purchaseLocation = dto.purchaseLocation ?? '';
    purchase.purchaseDate = new Date(dto.purchaseDate);
    purchase.discount = discount;
    purchase.freight = freight;

    const siblings = await this.filamentRepository.findByPurchaseId(filament.purchaseId);
    let subtotal = 0;
    for (const f of siblings) {
      const catalogUnit =
        f.id === filament.id
          ? unitCatalogPrice
          : this.catalogUnitForFilament(f, purchase);
      subtotal += catalogUnit;
    }

    purchase.price = subtotal;
    purchase.totalCost = subtotal - discount + freight;

    await this.purchaseRepository.update(purchase);
    const updated = await this.filamentRepository.update(filament);

    const reloaded = await this.filamentRepository.findById(dto.id);
    const p = reloaded?.purchase;
    if (!p) {
      throw new FilamentNotFoundError(dto.id);
    }

    return {
      id: updated.id,
      color: updated.color,
      filamentType: updated.filamentType,
      manufacturer: updated.manufacturer,
      purchaseLocation: p.purchaseLocation ?? '',
      costPerGram: updated.costPerGram,
      totalCost: updated.totalCost,
      purchaseDate: p.purchaseDate,
    };
  }

  /** Valor de catálogo por bobina; legado sem `unitPriceAtPurchase` usa média da compra */
  private catalogUnitForFilament(f: Filament, purchase: Purchase): number {
    if (f.unitPriceAtPurchase !== undefined && f.unitPriceAtPurchase !== null) {
      return f.unitPriceAtPurchase;
    }
    return purchase.price / purchase.quantity;
  }

  private validateRequiredFields(dto: UpdateFilamentDTO): void {
    const missingFields: string[] = [];

    if (!dto.id) {
      missingFields.push('id');
    }
    if (!dto.color || dto.color.trim() === '') {
      missingFields.push('color');
    }
    if (!dto.filamentType || dto.filamentType.trim() === '') {
      missingFields.push('filamentType');
    }
    if (dto.price === undefined || dto.price === null || dto.price <= 0) {
      missingFields.push('price');
    }
    if (!dto.purchaseDate) {
      missingFields.push('purchaseDate');
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`
      );
    }
  }
}
