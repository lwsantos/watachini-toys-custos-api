import { Filament } from './Filament';
import { PartFilament } from './PartFilament';

export class ProductPart {
  id: string;
  productId: string;
  name: string;
  weightGrams: number;
  printTimeHours: number;
  filaments: Filament[];
  partFilaments: PartFilament[];
  // Calculated costs
  filamentCost: number;
  energyCost: number;
  maintenanceCost: number;
  totalCost: number;
  // Configuration snapshot values used in calculation
  usedFilamentCostPerGram: number;
  usedEnergyCostPerHour: number;
  usedMaintenanceCostPerHour: number;
  createdAt: Date;

  constructor(props: Partial<ProductPart>) {
    Object.assign(this, props);
    this.filaments = props.filaments || [];
    this.partFilaments = props.partFilaments || [];
  }
}
