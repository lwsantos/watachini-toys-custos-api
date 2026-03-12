export interface FilamentCharacteristicsDTO {
  filamentType: string;
  manufacturer: string;
  color: string;
}

export interface CreateProductPartDTO {
  name: string;
  weightGrams: number;
  printTimeHours: number;
  filamentCharacteristics: FilamentCharacteristicsDTO[];
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  laborTimeMinutes?: number;
  parts: CreateProductPartDTO[];
}

export interface CreateProductResultDTO {
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
