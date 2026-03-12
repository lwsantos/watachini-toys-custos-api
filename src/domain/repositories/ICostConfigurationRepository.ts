import { CostConfiguration } from '../entities';

export interface ICostConfigurationRepository {
  get(): Promise<CostConfiguration>;
  update(config: CostConfiguration): Promise<CostConfiguration>;
}
