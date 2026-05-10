import { Purchase } from '../entities';

export interface IPurchaseRepository {
  create(purchase: Purchase): Promise<Purchase>;
  findById(id: string): Promise<Purchase | null>;
  update(purchase: Purchase): Promise<Purchase>;
}
