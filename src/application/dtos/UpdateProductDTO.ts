import { FilamentCharacteristicsDTO } from './CreateProductDTO';

export interface UpdateProductPartDTO {
  name: string;
  weightGrams: number;
  printTimeHours: number;
  filamentCharacteristics: FilamentCharacteristicsDTO[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  laborTimeMinutes?: number;
  parts?: UpdateProductPartDTO[];
}

export interface UpdateProductResultDTO {
  productId: string;
  name: string;
  totalCost: number;
  laborCost: number;
  parts: {
    partId: string;
    name: string;
    filamentCost: number;
    energyCost: number;
    maintenanceCost: number;
    totalCost: number;
  }[];
}
