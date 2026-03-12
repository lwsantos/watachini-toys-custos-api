import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostConfigurationDTO } from '../../dtos/CostConfigurationDTO';

/**
 * Input DTO for updating cost configuration
 */
export interface UpdateCostConfigurationInput {
  energyCostPerKwh: number;
  printerPowerKwh: number;
  laborCostPerHour: number;
  maintenanceCostPerHour: number;
}

/**
 * Use case for updating cost configuration values
 * Validates: Requirements 6.2, 6.3, 6.4
 */
export class UpdateCostConfigurationUseCase {
  constructor(private costConfigurationRepository: ICostConfigurationRepository) {}

  async execute(input: UpdateCostConfigurationInput): Promise<CostConfigurationDTO> {
    // Validate that all values are positive (>= 0)
    this.validatePositiveValues(input);

    // Get current configuration
    const config = await this.costConfigurationRepository.get();

    // Update configuration values
    config.energyCostPerKwh = input.energyCostPerKwh;
    config.printerPowerKwh = input.printerPowerKwh;
    config.laborCostPerHour = input.laborCostPerHour;
    config.maintenanceCostPerHour = input.maintenanceCostPerHour;
    config.updatedAt = new Date();

    // Persist updated configuration
    const updatedConfig = await this.costConfigurationRepository.update(config);

    return {
      id: updatedConfig.id,
      energyCostPerKwh: updatedConfig.energyCostPerKwh,
      printerPowerKwh: updatedConfig.printerPowerKwh,
      laborCostPerHour: updatedConfig.laborCostPerHour,
      maintenanceCostPerHour: updatedConfig.maintenanceCostPerHour,
      updatedAt: updatedConfig.updatedAt,
    };
  }

  private validatePositiveValues(input: UpdateCostConfigurationInput): void {
    const errors: string[] = [];

    if (input.energyCostPerKwh < 0) {
      errors.push('energyCostPerKwh must be a positive value');
    }

    if (input.printerPowerKwh < 0) {
      errors.push('printerPowerKwh must be a positive value');
    }

    if (input.laborCostPerHour < 0) {
      errors.push('laborCostPerHour must be a positive value');
    }

    if (input.maintenanceCostPerHour < 0) {
      errors.push('maintenanceCostPerHour must be a positive value');
    }

    if (errors.length > 0) {
      throw new Error(`VAL003: ${errors.join(', ')}`);
    }
  }
}
