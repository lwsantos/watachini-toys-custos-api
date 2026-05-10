import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { FilamentEntity, FilamentStatusEnum } from '../entities/FilamentEntity';
import { PurchaseEntity } from '../entities/PurchaseEntity';
import { IFilamentRepository, FilamentFilters } from '../../../../domain/repositories/IFilamentRepository';
import { Filament, FilamentCharacteristics, FilamentStatus, Purchase } from '../../../../domain/entities';

export class FilamentRepository implements IFilamentRepository {
  private repository: Repository<FilamentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(FilamentEntity);
  }

  async create(filament: Filament): Promise<Filament> {
    const entity = this.toEntity(filament);
    const savedEntity = await this.repository.save(entity);
    const reloaded = await this.reloadWithPurchase(savedEntity.id);
    return this.toDomain(reloaded!);
  }

  async findById(id: string): Promise<Filament | null> {
    const entity = await this.repository.findOne({ where: { id }, relations: ['purchase'] });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: FilamentFilters): Promise<Filament[]> {
    const qb = this.repository
      .createQueryBuilder('filament')
      .leftJoinAndSelect('filament.purchase', 'purchase');

    if (filters?.color) {
      qb.andWhere('filament.color ILIKE :color', { color: `%${filters.color}%` });
    }
    if (filters?.filamentType) {
      qb.andWhere('filament.filamentType = :filamentType', { filamentType: filters.filamentType });
    }
    if (filters?.status) {
      qb.andWhere('filament.status = :status', { status: this.toEntityStatus(filters.status) });
    }
    if (filters?.manufacturer) {
      qb.andWhere('filament.manufacturer = :manufacturer', { manufacturer: filters.manufacturer });
    }

    qb.orderBy('purchase.purchaseDate', 'ASC').addOrderBy('filament.createdAt', 'ASC');

    const entities = await qb.getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAvailableByColorAndType(color: string, type: string): Promise<Filament[]> {
    const entities = await this.repository
      .createQueryBuilder('filament')
      .leftJoinAndSelect('filament.purchase', 'purchase')
      .where('filament.color = :color', { color })
      .andWhere('filament.filamentType = :type', { type })
      .andWhere('filament.status = :status', { status: FilamentStatusEnum.AVAILABLE })
      .orderBy('purchase.purchaseDate', 'ASC')
      .getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllAvailable(): Promise<Filament[]> {
    const entities = await this.repository
      .createQueryBuilder('filament')
      .leftJoinAndSelect('filament.purchase', 'purchase')
      .where('filament.status = :status', { status: FilamentStatusEnum.AVAILABLE })
      .orderBy('purchase.purchaseDate', 'ASC')
      .getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAvailableByCharacteristics(
    filamentType: string,
    manufacturer: string,
    color: string
  ): Promise<Filament[]> {
    const entities = await this.repository
      .createQueryBuilder('filament')
      .leftJoinAndSelect('filament.purchase', 'purchase')
      .where('filament.filamentType = :filamentType', { filamentType })
      .andWhere('filament.manufacturer = :manufacturer', { manufacturer })
      .andWhere('filament.color = :color', { color })
      .andWhere('filament.status = :status', { status: FilamentStatusEnum.AVAILABLE })
      .orderBy('purchase.purchaseDate', 'ASC')
      .getMany();
    return entities.map((entity) => this.toDomain(entity));
  }

  async getUniqueAvailableCharacteristics(): Promise<FilamentCharacteristics[]> {
    const result = await this.repository
      .createQueryBuilder('filament')
      .select('filament.filament_type', 'filamentType')
      .addSelect('filament.manufacturer', 'manufacturer')
      .addSelect('filament.color', 'color')
      .where('filament.status = :status', { status: FilamentStatusEnum.AVAILABLE })
      .groupBy('filament.filament_type')
      .addGroupBy('filament.manufacturer')
      .addGroupBy('filament.color')
      .orderBy('filament.filament_type', 'ASC')
      .addOrderBy('filament.manufacturer', 'ASC')
      .addOrderBy('filament.color', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      filamentType: row.filamentType,
      manufacturer: row.manufacturer,
      color: row.color,
    }));
  }

  async updateStatus(id: string, status: FilamentStatus): Promise<void> {
    const entityStatus = this.toEntityStatus(status);
    await this.repository.update(id, { status: entityStatus });
  }

  async update(filament: Filament): Promise<Filament> {
    const entity = this.toEntity(filament);
    await this.repository.save(entity);
    const reloaded = await this.reloadWithPurchase(filament.id);
    return this.toDomain(reloaded!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateCostsForPurchase(purchaseId: string, totalCostPerUnit: number, costPerGram: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(FilamentEntity)
      .set({ totalCost: totalCostPerUnit, costPerGram })
      .where('purchase_id = :purchaseId', { purchaseId })
      .execute();
  }

  async findOldestAvailable(color: string, type: string): Promise<Filament | null> {
    const entity = await this.repository
      .createQueryBuilder('filament')
      .leftJoinAndSelect('filament.purchase', 'purchase')
      .where('filament.color = :color', { color })
      .andWhere('filament.filamentType = :type', { type })
      .andWhere('filament.status = :status', { status: FilamentStatusEnum.AVAILABLE })
      .orderBy('purchase.purchaseDate', 'ASC')
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async findByPurchaseId(purchaseId: string): Promise<Filament[]> {
    const entities = await this.repository.find({
      where: { purchaseId },
      relations: ['purchase'],
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  private async reloadWithPurchase(id: string): Promise<FilamentEntity | null> {
    return this.repository.findOne({ where: { id }, relations: ['purchase'] });
  }

  private toEntity(filament: Filament): FilamentEntity {
    const entity = new FilamentEntity();
    entity.id = filament.id;
    entity.purchaseId = filament.purchaseId;
    entity.color = filament.color;
    entity.filamentType = filament.filamentType;
    entity.manufacturer = filament.manufacturer;
    entity.costPerGram = filament.costPerGram;
    entity.totalCost = filament.totalCost;
    entity.unitPriceAtPurchase =
      filament.unitPriceAtPurchase !== undefined && filament.unitPriceAtPurchase !== null
        ? filament.unitPriceAtPurchase
        : null;
    entity.status = this.toEntityStatus(filament.status);
    entity.createdAt = filament.createdAt;
    return entity;
  }

  private purchaseEntityToDomain(entity: PurchaseEntity): Purchase {
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

  private toDomain(entity: FilamentEntity): Filament {
    const purchase = entity.purchase ? this.purchaseEntityToDomain(entity.purchase) : undefined;
    return new Filament({
      id: entity.id,
      purchaseId: entity.purchaseId,
      color: entity.color,
      filamentType: entity.filamentType,
      manufacturer: entity.manufacturer,
      costPerGram: Number(entity.costPerGram),
      totalCost: Number(entity.totalCost),
      unitPriceAtPurchase:
        entity.unitPriceAtPurchase !== null && entity.unitPriceAtPurchase !== undefined
          ? Number(entity.unitPriceAtPurchase)
          : undefined,
      status: this.toDomainStatus(entity.status),
      createdAt: entity.createdAt,
      purchase,
    });
  }

  private toEntityStatus(status: FilamentStatus): FilamentStatusEnum {
    return status === FilamentStatus.AVAILABLE ? FilamentStatusEnum.AVAILABLE : FilamentStatusEnum.EMPTY;
  }

  private toDomainStatus(status: FilamentStatusEnum): FilamentStatus {
    return status === FilamentStatusEnum.AVAILABLE ? FilamentStatus.AVAILABLE : FilamentStatus.EMPTY;
  }
}
