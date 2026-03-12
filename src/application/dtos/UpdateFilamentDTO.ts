export interface UpdateFilamentDTO {
  id: string;
  color: string;
  filamentType: string;
  manufacturer?: string;
  purchaseLocation?: string;
  price: number;
  discount?: number;
  freight?: number;
  purchaseDate: Date;
}

export interface UpdateFilamentResultDTO {
  id: string;
  color: string;
  filamentType: string;
  manufacturer: string;
  purchaseLocation: string;
  costPerGram: number;
  totalCost: number;
  purchaseDate: Date;
}
