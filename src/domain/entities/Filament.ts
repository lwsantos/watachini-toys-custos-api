export enum FilamentStatus {
  AVAILABLE = 'available',
  EMPTY = 'empty'
}

export class Filament {
  id: string;
  purchaseId: string;
  color: string;
  filamentType: string;
  manufacturer: string;
  costPerGram: number;
  totalCost: number;
  status: FilamentStatus;
  purchaseDate: Date;
  purchaseLocation?: string;
  purchasePrice?: number;
  purchaseDiscount?: number;
  purchaseFreight?: number;
  purchaseQuantity?: number;
  createdAt: Date;

  constructor(props: Partial<Filament>) {
    Object.assign(this, props);
  }
}
