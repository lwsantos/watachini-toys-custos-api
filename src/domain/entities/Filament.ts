import { Purchase } from './Purchase';

export enum FilamentStatus {
  AVAILABLE = 'available',
  EMPTY = 'empty',
}

export class Filament {
  id: string;
  purchaseId: string;
  color: string;
  filamentType: string;
  manufacturer: string;
  costPerGram: number;
  totalCost: number;
  /** Valor unitário na compra, antes de frete/desconto rateados; ausente em registros antigos */
  unitPriceAtPurchase?: number;
  status: FilamentStatus;
  createdAt: Date;

  /** Preenchido quando o repositório carrega a relação com Purchase */
  purchase?: Purchase;

  constructor(props: Partial<Filament>) {
    Object.assign(this, props);
  }
}
