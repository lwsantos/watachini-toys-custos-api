export class CostConfiguration {
  id: string;
  energyCostPerKwh: number;
  printerPowerKwh: number;
  laborCostPerHour: number;
  maintenanceCostPerHour: number;
  updatedAt: Date;

  constructor(props: Partial<CostConfiguration>) {
    Object.assign(this, props);
  }
}
