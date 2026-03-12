import { UpdateCostConfigurationUseCase, UpdateCostConfigurationInput } from './UpdateCostConfigurationUseCase';
import { ICostConfigurationRepository } from '../../../domain/repositories/ICostConfigurationRepository';
import { CostConfiguration } from '../../../domain/entities';

describe('UpdateCostConfigurationUseCase', () => {
  let useCase: UpdateCostConfigurationUseCase;
  let mockRepository: jest.Mocked<ICostConfigurationRepository>;

  const existingConfig = new CostConfiguration({
    id: 'config-1',
    energyCostPerHour: 1.0,
    laborCostPerHour: 10.0,
    maintenanceCostPerHour: 2.0,
    updatedAt: new Date('2024-01-01'),
  });

  beforeEach(() => {
    mockRepository = {
      get: jest.fn().mockResolvedValue(existingConfig),
      update: jest.fn().mockImplementation((config: CostConfiguration) => 
        Promise.resolve(new CostConfiguration({ ...config }))
      ),
    };

    useCase = new UpdateCostConfigurationUseCase(mockRepository);
  });

  describe('successful updates', () => {
    it('should update configuration with valid positive values', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 2.5,
        laborCostPerHour: 15.0,
        maintenanceCostPerHour: 3.0,
      };

      const result = await useCase.execute(input);

      expect(result.energyCostPerHour).toBe(2.5);
      expect(result.laborCostPerHour).toBe(15.0);
      expect(result.maintenanceCostPerHour).toBe(3.0);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('should accept zero values as valid', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 0,
        laborCostPerHour: 0,
        maintenanceCostPerHour: 0,
      };

      const result = await useCase.execute(input);

      expect(result.energyCostPerHour).toBe(0);
      expect(result.laborCostPerHour).toBe(0);
      expect(result.maintenanceCostPerHour).toBe(0);
    });

    it('should return updated configuration with new updatedAt timestamp', async () => {
      const beforeUpdate = new Date();
      
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 5.0,
        laborCostPerHour: 20.0,
        maintenanceCostPerHour: 4.0,
      };

      const result = await useCase.execute(input);

      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    });

    it('should preserve the configuration id', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 1.5,
        laborCostPerHour: 12.0,
        maintenanceCostPerHour: 2.5,
      };

      const result = await useCase.execute(input);

      expect(result.id).toBe('config-1');
    });
  });

  describe('validation errors', () => {
    it('should reject negative energyCostPerHour', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: -1.0,
        laborCostPerHour: 10.0,
        maintenanceCostPerHour: 2.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('VAL003');
      await expect(useCase.execute(input)).rejects.toThrow('energyCostPerHour must be a positive value');
    });

    it('should reject negative laborCostPerHour', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 1.0,
        laborCostPerHour: -10.0,
        maintenanceCostPerHour: 2.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('VAL003');
      await expect(useCase.execute(input)).rejects.toThrow('laborCostPerHour must be a positive value');
    });

    it('should reject negative maintenanceCostPerHour', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: 1.0,
        laborCostPerHour: 10.0,
        maintenanceCostPerHour: -2.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('VAL003');
      await expect(useCase.execute(input)).rejects.toThrow('maintenanceCostPerHour must be a positive value');
    });

    it('should report all negative values in error message', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: -1.0,
        laborCostPerHour: -10.0,
        maintenanceCostPerHour: -2.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow('energyCostPerHour must be a positive value');
      await expect(useCase.execute(input)).rejects.toThrow('laborCostPerHour must be a positive value');
      await expect(useCase.execute(input)).rejects.toThrow('maintenanceCostPerHour must be a positive value');
    });

    it('should not call repository update when validation fails', async () => {
      const input: UpdateCostConfigurationInput = {
        energyCostPerHour: -1.0,
        laborCostPerHour: 10.0,
        maintenanceCostPerHour: 2.0,
      };

      await expect(useCase.execute(input)).rejects.toThrow();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });
});
