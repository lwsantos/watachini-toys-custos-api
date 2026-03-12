/**
 * DTO for cost configuration result
 * Validates: Requirements 6.1
 */
export interface CostConfigurationDTO {
  id: string;
  energyCostPerKwh: number;
  printerPowerKwh: number;
  laborCostPerHour: number;
  maintenanceCostPerHour: number;
  updatedAt: Date;
}
