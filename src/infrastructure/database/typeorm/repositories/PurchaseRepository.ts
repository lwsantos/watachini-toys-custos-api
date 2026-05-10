import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { PurchaseEntity } from '../entities/PurchaseEntity';
import { IPurchaseRepository } from '../../../../domain/repositories/IPurchaseRepository';
import { Purchase } from '../../../../domain/entities';

export class PurchaseRepository implements IPurchaseRepository {
  private repository: Repository<PurchaseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(PurchaseEntity);
  }

  async create(purchase: Purchase): Promise<Purchase> {
    const entity = this.toEntity(purchase);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Purchase | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(purchase: Purchase): Promise<Purchase> {
    const entity = this.toEntity(purchase);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  private toEntity(purchase: Purchase): PurchaseEntity {
    const entity = new PurchaseEntity();
    entity.id = purchase.id;
    entity.price = purchase.price;
    entity.quantity = purchase.quantity;
    entity.discount = purchase.discount;
    entity.freight = purchase.freight;
    entity.totalCost = purchase.totalCost;
    entity.purchaseDate = purchase.purchaseDate;
    entity.purchaseLocation = purchase.purchaseLocation ?? null;
    entity.createdAt = purchase.createdAt;
    return entity;
  }

  private toDomain(entity: PurchaseEntity): Purchase {
    return new Purchase({
      id: entity.id,
      price: Number(entity.price),
      quantity: Number(entity.quantity),
      discount: Number(entity.discount),
      freight: Number(entity.freight),
      totalCost: Number(entity.totalCost),
      purchaseDate: entity.purchaseDate,
      purchaseLocation: entity.purchaseLocation ?? undefined,
      createdAt: entity.createdAt,
    });
  }
}
