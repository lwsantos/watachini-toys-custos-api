import { v4 as uuidv4 } from 'uuid';
import { Filament, Purchase, FilamentStatus } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IPurchaseRepository } from '../../../domain/repositories/IPurchaseRepository';
import { RegisterFilamentPurchaseDTO } from '../../dtos/RegisterFilamentPurchaseDTO';
import { ValidationError } from './RegisterFilamentPurchaseUseCase';
import { PurchaseNotFoundError } from './errors';

export interface UpdateFilamentPurchaseResultDTO {
  purchaseId: string;
}

/** Mesma validação de payload que em RegisterFilamentPurchaseUseCase */
function validatePurchasePayload(dto: RegisterFilamentPurchaseDTO): void {
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

interface TargetRow {
  color: string;
  filamentType: string;
  manufacturer: string;
  unitPrice: number;
}

export class UpdateFilamentPurchaseUseCase {
  constructor(
    private filamentRepository: IFilamentRepository,
    private purchaseRepository: IPurchaseRepository
  ) {}

  async execute(
    purchaseId: string,
    dto: RegisterFilamentPurchaseDTO
  ): Promise<UpdateFilamentPurchaseResultDTO> {
    validatePurchasePayload(dto);

    const purchase = await this.purchaseRepository.findById(purchaseId);
    if (!purchase) {
      throw new PurchaseNotFoundError(purchaseId);
    }

    const lines = dto.lines;
    const totalSpools = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const totalDiscount = dto.discount ?? 0;
    const totalFreight = dto.freight ?? 0;
    const totalPurchaseCost = subtotal - totalDiscount + totalFreight;

    const discountPerSpool = totalDiscount / totalSpools;
    const freightPerSpool = totalFreight / totalSpools;

    const targets: TargetRow[] = [];
    for (const line of lines) {
      const manufacturer = (line.manufacturer ?? '').trim();
      for (let i = 0; i < line.quantity; i++) {
        targets.push({
          color: line.color,
          filamentType: line.filamentType,
          manufacturer,
          unitPrice: line.unitPrice,
        });
      }
    }

    let existing = await this.filamentRepository.findByPurchaseId(purchaseId);
    existing.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const now = new Date();

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const unitCostPerSpool = t.unitPrice - discountPerSpool + freightPerSpool;
      const costPerGram = Math.round((unitCostPerSpool / 1000) * 100) / 100;

      if (i < existing.length) {
        const f = existing[i];
        f.color = t.color;
        f.filamentType = t.filamentType;
        f.manufacturer = t.manufacturer;
        f.unitPriceAtPurchase = t.unitPrice;
        f.totalCost = unitCostPerSpool;
        f.costPerGram = costPerGram;
        await this.filamentRepository.update(f);
      } else {
        const filamentId = uuidv4();
        const filament = new Filament({
          id: filamentId,
          purchaseId,
          color: t.color,
          filamentType: t.filamentType,
          manufacturer: t.manufacturer,
          unitPriceAtPurchase: t.unitPrice,
          costPerGram,
          totalCost: unitCostPerSpool,
          status: FilamentStatus.AVAILABLE,
          createdAt: now,
        });
        await this.filamentRepository.create(filament);
      }
    }

    for (let i = targets.length; i < existing.length; i++) {
      await this.filamentRepository.delete(existing[i].id);
    }

    purchase.price = subtotal;
    purchase.quantity = totalSpools;
    purchase.discount = totalDiscount;
    purchase.freight = totalFreight;
    purchase.totalCost = totalPurchaseCost;
    purchase.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : purchase.purchaseDate;
    purchase.purchaseLocation = dto.purchaseLocation ?? '';

    await this.purchaseRepository.update(purchase);

    return { purchaseId };
  }
}
