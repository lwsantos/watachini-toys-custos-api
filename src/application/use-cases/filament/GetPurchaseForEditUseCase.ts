import { Filament, Purchase } from '../../../domain/entities';
import { IFilamentRepository } from '../../../domain/repositories/IFilamentRepository';
import { IPurchaseRepository } from '../../../domain/repositories/IPurchaseRepository';
import {
  RegisterFilamentPurchaseLineDTO,
} from '../../dtos/RegisterFilamentPurchaseDTO';
import { PurchaseNotFoundError } from './errors';

export interface PurchaseForEditDTO {
  purchaseId: string;
  purchaseDate: Date;
  purchaseLocation: string;
  discount: number;
  freight: number;
  lines: RegisterFilamentPurchaseLineDTO[];
}

interface AggLine extends RegisterFilamentPurchaseLineDTO {
  sortKey: number;
}

function normManufacturer(m: string | undefined): string {
  return (m ?? '').trim();
}

export class GetPurchaseForEditUseCase {
  constructor(
    private filamentRepository: IFilamentRepository,
    private purchaseRepository: IPurchaseRepository
  ) {}

  async execute(purchaseId: string): Promise<PurchaseForEditDTO> {
    const purchase = await this.purchaseRepository.findById(purchaseId);
    if (!purchase) {
      throw new PurchaseNotFoundError(purchaseId);
    }

    const filaments = await this.filamentRepository.findByPurchaseId(purchaseId);
    filaments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const lines = this.aggregateLines(filaments, purchase);

    return {
      purchaseId,
      purchaseDate: purchase.purchaseDate,
      purchaseLocation: purchase.purchaseLocation ?? '',
      discount: purchase.discount,
      freight: purchase.freight,
      lines,
    };
  }

  private aggregateLines(filaments: Filament[], purchase: Purchase): RegisterFilamentPurchaseLineDTO[] {
    const qtyBase = Math.max(purchase.quantity || filaments.length || 1, 1);
    const fallbackUnit = purchase.price / qtyBase;

    const map = new Map<string, AggLine>();

    for (const f of filaments) {
      const unitRaw =
        f.unitPriceAtPurchase !== undefined && f.unitPriceAtPurchase !== null
          ? f.unitPriceAtPurchase
          : fallbackUnit;
      const unit = Math.round(unitRaw * 100) / 100;
      const key = `${f.color}|${f.filamentType}|${normManufacturer(f.manufacturer)}|${unit.toFixed(2)}`;

      const t = f.createdAt.getTime();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          color: f.color,
          filamentType: f.filamentType,
          manufacturer: normManufacturer(f.manufacturer) || undefined,
          quantity: 1,
          unitPrice: unit,
          sortKey: t,
        });
      } else {
        existing.quantity += 1;
        existing.sortKey = Math.min(existing.sortKey, t);
      }
    }

    return [...map.values()]
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey: _s, ...line }) => line);
  }
}
