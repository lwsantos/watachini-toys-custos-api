import { FilamentStatus } from '../../domain/entities';

export interface ListFilamentsFilterDTO {
  color?: string;
  filamentType?: string;
  status?: FilamentStatus;
  manufacturer?: string;
}

export interface FilamentDTO {
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
}

export interface ListFilamentsResultDTO {
  filaments: FilamentDTO[];
  total: number;
}
