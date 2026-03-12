import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostConfigurationDTO } from '../../dtos/CostConfigurationDTO';

/**
 * Use case for fetching the current cost configuration
 * Validates: Requirements 6.1
 */
export class GetCostConfigurationUseCase {
  constructor(private costConfigurationRepository: ICostConfigurationRepository) {}

  async execute(): Promise<CostConfigurationDTO> {
    const config = await this.costConfigurationRepository.get();

    return {
      id: config.id,
      energyCostPerKwh: config.energyCostPerKwh,
      printerPowerKwh: config.printerPowerKwh,
      laborCostPerHour: config.laborCostPerHour,
      maintenanceCostPerHour: config.maintenanceCostPerHour,
      updatedAt: config.updatedAt,
    };
  }
}
