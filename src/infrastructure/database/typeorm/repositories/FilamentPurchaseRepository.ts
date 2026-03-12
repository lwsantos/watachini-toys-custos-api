import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { FilamentPurchaseEntity } from '../entities/FilamentPurchaseEntity';
import { IFilamentPurchaseRepository } from '../../../../domain/repositories/IFilamentPurchaseRepository';
import { FilamentPurchase } from '../../../../domain/entities';

export class FilamentPurchaseRepository implements IFilamentPurchaseRepository {
  private repository: Repository<FilamentPurchaseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(FilamentPurchaseEntity);
  }

  async create(purchase: FilamentPurchase): Promise<FilamentPurchase> {
    const entity = this.toEntity(purchase);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<FilamentPurchase | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(purchase: FilamentPurchase): Promise<FilamentPurchase> {
    const entity = this.toEntity(purchase);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  private toEntity(purchase: FilamentPurchase): FilamentPurchaseEntity {
    const entity = new FilamentPurchaseEntity();
    entity.id = purchase.id;
    entity.price = purchase.price;
    entity.quantity = purchase.quantity;
    entity.discount = purchase.discount;
    entity.freight = purchase.freight;
    entity.manufacturer = purchase.manufacturer;
    entity.purchaseLocation = purchase.purchaseLocation;
    entity.color = purchase.color;
    entity.filamentType = purchase.filamentType;
    entity.totalCost = purchase.totalCost;
    entity.purchaseDate = purchase.purchaseDate;
    entity.createdAt = purchase.createdAt;
    return entity;
  }

  private toDomain(entity: FilamentPurchaseEntity): FilamentPurchase {
    return new FilamentPurchase({
      id: entity.id,
      price: Number(entity.price),
      quantity: Number(entity.quantity),
      discount: Number(entity.discount),
      freight: Number(entity.freight),
      manufacturer: entity.manufacturer,
      purchaseLocation: entity.purchaseLocation,
      color: entity.color,
      filamentType: entity.filamentType,
      totalCost: Number(entity.totalCost),
      purchaseDate: entity.purchaseDate,
      createdAt: entity.createdAt,
    });
  }
}
