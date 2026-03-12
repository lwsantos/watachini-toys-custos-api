export interface RegisterFilamentPurchaseDTO {
  price: number;
  quantity: number;
  discount?: number;
  freight?: number;
  manufacturer?: string;
  purchaseLocation?: string;
  color: string;
  filamentType: string;
  purchaseDate?: Date;
}

export interface RegisterFilamentPurchaseResultDTO {
  purchaseId: string;
  filamentId: string;
  totalCost: number;
  costPerGram: number;
}
