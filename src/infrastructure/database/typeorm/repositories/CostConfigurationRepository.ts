import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CostConfigurationEntity } from '../entities/CostConfigurationEntity';
import { ICostConfigurationRepository } from '../../../../domain/repositories/ICostConfigurationRepository';
import { CostConfiguration } from '../../../../domain/entities';

export class CostConfigurationRepository implements ICostConfigurationRepository {
  private repository: Repository<CostConfigurationEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CostConfigurationEntity);
  }

  async get(): Promise<CostConfiguration> {
    let entity = await this.repository.findOne({ where: {} });

    if (!entity) {
      // Create default configuration if none exists
      entity = await this.createDefaultConfiguration();
    }

    return this.toDomain(entity);
  }

  async update(config: CostConfiguration): Promise<CostConfiguration> {
    let entity = await this.repository.findOne({ where: {} });

    if (!entity) {
      entity = new CostConfigurationEntity();
    }

    entity.energyCostPerKwh = config.energyCostPerKwh;
    entity.printerPowerKwh = config.printerPowerKwh;
    entity.laborCostPerHour = config.laborCostPerHour;
    entity.maintenanceCostPerHour = config.maintenanceCostPerHour;

    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  private async createDefaultConfiguration(): Promise<CostConfigurationEntity> {
    const entity = new CostConfigurationEntity();
    entity.energyCostPerKwh = 0.80; // Custo médio do kWh no Brasil
    entity.printerPowerKwh = 0.2; // Consumo típico de uma impressora 3D
    entity.laborCostPerHour = 25.00;
    entity.maintenanceCostPerHour = 2.00;

    return await this.repository.save(entity);
  }

  private toDomain(entity: CostConfigurationEntity): CostConfiguration {
    return new CostConfiguration({
      id: entity.id,
      energyCostPerKwh: Number(entity.energyCostPerKwh),
      printerPowerKwh: Number(entity.printerPowerKwh),
      laborCostPerHour: Number(entity.laborCostPerHour),
      maintenanceCostPerHour: Number(entity.maintenanceCostPerHour),
      updatedAt: entity.updatedAt,
    });
  }
}
