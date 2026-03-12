import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { AppDataSource } from '../data-source';
import { FilamentEntity, FilamentStatusEnum } from '../entities/FilamentEntity';
import { IFilamentRepository, FilamentFilters } from '../../../../domain/repositories/IFilamentRepository';
import { Filament, FilamentCharacteristics, FilamentStatus } from '../../../../domain/entities';

export class FilamentRepository implements IFilamentRepository {
  private repository: Repository<FilamentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(FilamentEntity);
  }

  async create(filament: Filament): Promise<Filament> {
    const entity = this.toEntity(filament);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Filament | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: FilamentFilters): Promise<Filament[]> {
    const where: FindOptionsWhere<FilamentEntity> = {};

    if (filters?.color) {
      where.color = ILike(`%${filters.color}%`);
    }

    if (filters?.filamentType) {
      where.filamentType = filters.filamentType;
    }

    if (filters?.status) {
      where.status = this.toEntityStatus(filters.status);
    }

    if (filters?.manufacturer) {
      where.manufacturer = filters.manufacturer;
    }

    const entities = await this.repository.find({
      where,
      relations: ['purchase'],
      order: {
        purchaseDate: 'ASC',
      },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findAvailableByColorAndType(color: string, type: string): Promise<Filament[]> {
    const entities = await this.repository.find({
      where: {
        color,
        filamentType: type,
        status: FilamentStatusEnum.AVAILABLE,
      },
      order: {
        purchaseDate: 'ASC',
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllAvailable(): Promise<Filament[]> {
    const entities = await this.repository.find({
      where: {
        status: FilamentStatusEnum.AVAILABLE,
      },
      order: {
        purchaseDate: 'ASC',
      },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAvailableByCharacteristics(
    filamentType: string,
    manufacturer: string,
    color: string
  ): Promise<Filament[]> {
    const entities = await this.repository.find({
      where: {
        filamentType,
        manufacturer,
        color,
        status: FilamentStatusEnum.AVAILABLE,
      },
      order: {
        purchaseDate: 'ASC',
      },
    });
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
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findOldestAvailable(color: string, type: string): Promise<Filament | null> {
    const entity = await this.repository.findOne({
      where: {
        color,
        filamentType: type,
        status: FilamentStatusEnum.AVAILABLE,
      },
      order: {
        purchaseDate: 'ASC',
      },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPurchaseId(purchaseId: string): Promise<Filament[]> {
    const entities = await this.repository.find({
      where: { purchaseId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
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
    entity.status = this.toEntityStatus(filament.status);
    entity.purchaseDate = filament.purchaseDate;
    entity.createdAt = filament.createdAt;
    return entity;
  }

  private toDomain(entity: FilamentEntity): Filament {
    return new Filament({
      id: entity.id,
      purchaseId: entity.purchaseId,
      color: entity.color,
      filamentType: entity.filamentType,
      manufacturer: entity.manufacturer,
      costPerGram: Number(entity.costPerGram),
      totalCost: Number(entity.totalCost),
      status: this.toDomainStatus(entity.status),
      purchaseDate: entity.purchaseDate,
      purchaseLocation: entity.purchase?.purchaseLocation,
      purchasePrice: entity.purchase ? Number(entity.purchase.price) : undefined,
      purchaseDiscount: entity.purchase ? Number(entity.purchase.discount) : undefined,
      purchaseFreight: entity.purchase ? Number(entity.purchase.freight) : undefined,
      purchaseQuantity: entity.purchase ? Number(entity.purchase.quantity) : undefined,
      createdAt: entity.createdAt,
    });
  }

  private toEntityStatus(status: FilamentStatus): FilamentStatusEnum {
    return status === FilamentStatus.AVAILABLE
      ? FilamentStatusEnum.AVAILABLE
      : FilamentStatusEnum.EMPTY;
  }

  private toDomainStatus(status: FilamentStatusEnum): FilamentStatus {
    return status === FilamentStatusEnum.AVAILABLE
      ? FilamentStatus.AVAILABLE
      : FilamentStatus.EMPTY;
  }
}
