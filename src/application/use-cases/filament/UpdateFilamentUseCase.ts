import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IFilamentPurchaseRepository } from '../../../domain/repositories/IFilamentPurchaseRepository';
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
    private filamentPurchaseRepository: IFilamentPurchaseRepository
  ) {}

  async execute(dto: UpdateFilamentDTO): Promise<UpdateFilamentResultDTO> {
    this.validateRequiredFields(dto);

    const filament = await this.filamentRepository.findById(dto.id);
    if (!filament) {
      throw new FilamentNotFoundError(dto.id);
    }

    const price = dto.price;
    const discount = dto.discount ?? 0;
    const freight = dto.freight ?? 0;

    // Buscar quantidade do purchase para dividir frete e desconto
    let quantity = 1;
    if (filament.purchaseId) {
      const purchase = await this.filamentPurchaseRepository.findById(filament.purchaseId);
      if (purchase) {
        quantity = purchase.quantity;
      }
    }

    // Calcular custo unitário: preço - (desconto/qtd) + (frete/qtd)
    const discountPerUnit = discount / quantity;
    const freightPerUnit = freight / quantity;
    const unitCost = (price - discountPerUnit) + freightPerUnit;
    const costPerGram = Math.round((unitCost / 1000) * 100) / 100;

    // Calcular custo total da compra (para o purchase)
    const totalPurchaseCost = (price - discount) + freight;

    // Atualizar filamento
    filament.color = dto.color;
    filament.filamentType = dto.filamentType;
    filament.manufacturer = dto.manufacturer ?? '';
    filament.totalCost = unitCost;
    filament.costPerGram = costPerGram;
    filament.purchaseDate = new Date(dto.purchaseDate);

    const updated = await this.filamentRepository.update(filament);

    // Atualizar FilamentPurchase e todos os filamentos relacionados
    if (filament.purchaseId) {
      const purchase = await this.filamentPurchaseRepository.findById(filament.purchaseId);
      if (purchase) {
        purchase.color = dto.color;
        purchase.filamentType = dto.filamentType;
        purchase.manufacturer = dto.manufacturer ?? '';
        purchase.purchaseLocation = dto.purchaseLocation ?? '';
        purchase.price = price;
        purchase.discount = discount;
        purchase.freight = freight;
        purchase.totalCost = totalPurchaseCost;
        purchase.purchaseDate = new Date(dto.purchaseDate);
        await this.filamentPurchaseRepository.update(purchase);

        // Atualizar todos os filamentos do mesmo purchase
        const relatedFilaments = await this.filamentRepository.findByPurchaseId(filament.purchaseId);
        for (const related of relatedFilaments) {
          if (related.id !== filament.id) {
            related.color = dto.color;
            related.filamentType = dto.filamentType;
            related.manufacturer = dto.manufacturer ?? '';
            related.totalCost = unitCost;
            related.costPerGram = costPerGram;
            related.purchaseDate = new Date(dto.purchaseDate);
            await this.filamentRepository.update(related);
          }
        }
      }
    }

    return {
      id: updated.id,
      color: updated.color,
      filamentType: updated.filamentType,
      manufacturer: updated.manufacturer,
      purchaseLocation: dto.purchaseLocation ?? '',
      costPerGram: updated.costPerGram,
      totalCost: updated.totalCost,
      purchaseDate: updated.purchaseDate,
    };
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
