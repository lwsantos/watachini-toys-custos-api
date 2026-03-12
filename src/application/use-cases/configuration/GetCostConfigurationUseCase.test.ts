import { GetCostConfigurationUseCase } from './GetCostConfigurationUseCase';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostConfiguration } from '../../../domain/entities';

describe('GetCostConfigurationUseCase', () => {
  let useCase: GetCostConfigurationUseCase;
  let mockRepository: jest.Mocked<ICostConfigurationRepository>;

  beforeEach(() => {
    mockRepository = {
      get: jest.fn(),
      update: jest.fn(),
    };
    useCase = new GetCostConfigurationUseCase(mockRepository);
  });

  it('should return the current cost configuration', async () => {
    const mockConfig = new CostConfiguration({
      id: 'config-123',
      energyCostPerKwh: 1.5,
      printerPowerKwh: 0.2,
      laborCostPerHour: 25.0,
      maintenanceCostPerHour: 2.0,
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    });

    mockRepository.get.mockResolvedValue(mockConfig);

    const result = await useCase.execute();

    expect(mockRepository.get).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: 'config-123',
      energyCostPerKwh: 1.5,
      printerPowerKwh: 0.2,
      laborCostPerHour: 25.0,
      maintenanceCostPerHour: 2.0,
      updatedAt: new Date('2024-01-15T10:00:00Z'),
    });
  });

  it('should return default configuration when repository returns defaults', async () => {
    const defaultConfig = new CostConfiguration({
      id: 'default-config',
      energyCostPerKwh: 0,
      printerPowerKwh: 0,
      laborCostPerHour: 0,
      maintenanceCostPerHour: 0,
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    });

    mockRepository.get.mockResolvedValue(defaultConfig);

    const result = await useCase.execute();

    expect(result.energyCostPerKwh).toBe(0);
    expect(result.printerPowerKwh).toBe(0);
    expect(result.laborCostPerHour).toBe(0);
    expect(result.maintenanceCostPerHour).toBe(0);
  });

  it('should return all configuration fields correctly', async () => {
    const config = new CostConfiguration({
      id: 'config-456',
      energyCostPerKwh: 2.5,
      printerPowerKwh: 0.3,
      laborCostPerHour: 30.0,
      maintenanceCostPerHour: 3.5,
      updatedAt: new Date('2024-06-20T15:30:00Z'),
    });

    mockRepository.get.mockResolvedValue(config);

    const result = await useCase.execute();

    expect(result.id).toBe('config-456');
    expect(result.energyCostPerKwh).toBe(2.5);
    expect(result.printerPowerKwh).toBe(0.3);
    expect(result.laborCostPerHour).toBe(30.0);
    expect(result.maintenanceCostPerHour).toBe(3.5);
    expect(result.updatedAt).toEqual(new Date('2024-06-20T15:30:00Z'));
  });
});
