import { FilamentPurchase } from '../entities';

export interface IFilamentPurchaseRepository {
  create(purchase: FilamentPurchase): Promise<FilamentPurchase>;
  findById(id: string): Promise<FilamentPurchase | null>;
  update(purchase: FilamentPurchase): Promise<FilamentPurchase>;
}
