import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { ProductEntity } from '../entities/ProductEntity';
import { ProductPartEntity } from '../entities/ProductPartEntity';
import { PartFilamentEntity } from '../entities/PartFilamentEntity';
import { IProductRepository } from '../../../../domain/repositories/IProductRepository';
import { Product, ProductPart } from '../../../../domain/entities';
import { PartFilament } from '../../../../domain/entities/PartFilament';

export class ProductRepository implements IProductRepository {
  private repository: Repository<ProductEntity>;
  private partRepository: Repository<ProductPartEntity>;
  private partFilamentRepository: Repository<PartFilamentEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProductEntity);
    this.partRepository = AppDataSource.getRepository(ProductPartEntity);
    this.partFilamentRepository = AppDataSource.getRepository(PartFilamentEntity);
  }

  async create(product: Product): Promise<Product> {
    const entity = this.toEntity(product);
    const savedEntity = await this.repository.save(entity);
    
    // Reload with all relations
    const reloadedEntity = await this.repository.findOne({
      where: { id: savedEntity.id },
      relations: ['parts', 'parts.partFilaments'],
    });
    
    return this.toDomain(reloadedEntity!);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['parts', 'parts.partFilaments'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<Product[]> {
    const entities = await this.repository.find({
      relations: ['parts', 'parts.partFilaments'],
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async update(product: Product): Promise<Product> {
    // First, delete existing parts and their filament associations
    const existingEntity = await this.repository.findOne({
      where: { id: product.id },
      relations: ['parts'],
    });

    if (existingEntity && existingEntity.parts) {
      for (const part of existingEntity.parts) {
        await this.partFilamentRepository.delete({ partId: part.id });
      }
      await this.partRepository.delete({ productId: product.id });
    }

    // Update the product with new parts
    const entity = this.toEntity(product);
    await this.repository.save(entity);

    // Reload with all relations
    const reloadedEntity = await this.repository.findOne({
      where: { id: product.id },
      relations: ['parts', 'parts.partFilaments'],
    });

    return this.toDomain(reloadedEntity!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private toEntity(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.name = product.name;
    entity.description = product.description;
    entity.laborTimeMinutes = product.laborTimeMinutes || 0;
    entity.totalCost = product.totalCost;
    entity.profitMargin = product.profitMargin;
    entity.finalPrice = product.finalPrice;
    
    if (product.createdAt) {
      entity.createdAt = product.createdAt;
    }
    if (product.updatedAt) {
      entity.updatedAt = product.updatedAt;
    }

    entity.parts = product.parts?.map((part) => this.toPartEntity(part, product.id)) || [];

    return entity;
  }

  private toPartEntity(part: ProductPart, productId: string): ProductPartEntity {
    const entity = new ProductPartEntity();
    entity.id = part.id;
    entity.productId = productId;
    entity.name = part.name;
    entity.weightGrams = part.weightGrams;
    entity.printTimeHours = part.printTimeHours;
    entity.filamentCost = part.filamentCost || 0;
    entity.energyCost = part.energyCost || 0;
    entity.maintenanceCost = part.maintenanceCost || 0;
    entity.totalCost = part.totalCost || 0;
    entity.usedFilamentCostPerGram = part.usedFilamentCostPerGram || 0;
    entity.usedEnergyCostPerHour = part.usedEnergyCostPerHour || 0;
    entity.usedMaintenanceCostPerHour = part.usedMaintenanceCostPerHour || 0;
    
    if (part.createdAt) {
      entity.createdAt = part.createdAt;
    }

    // Save filament characteristics instead of filament IDs
    entity.partFilaments = part.partFilaments?.map((pf) => {
      const partFilament = new PartFilamentEntity();
      partFilament.id = pf.id;
      partFilament.partId = part.id;
      partFilament.filamentType = pf.filamentType;
      partFilament.manufacturer = pf.manufacturer;
      partFilament.color = pf.color;
      if (pf.createdAt) {
        partFilament.createdAt = pf.createdAt;
      }
      return partFilament;
    }) || [];

    return entity;
  }

  private toDomain(entity: ProductEntity): Product {
    return new Product({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      laborTimeMinutes: entity.laborTimeMinutes || 0,
      totalCost: Number(entity.totalCost),
      profitMargin: Number(entity.profitMargin),
      finalPrice: Number(entity.finalPrice),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      parts: entity.parts?.map((partEntity) => this.toPartDomain(partEntity)) || [],
    });
  }

  private toPartDomain(entity: ProductPartEntity): ProductPart {
    // Convert PartFilamentEntity to PartFilament domain objects
    const partFilaments = entity.partFilaments?.map((pf) => new PartFilament({
      id: pf.id,
      partId: pf.partId,
      filamentType: pf.filamentType,
      manufacturer: pf.manufacturer,
      color: pf.color,
      createdAt: pf.createdAt,
    })) || [];
    
    return new ProductPart({
      id: entity.id,
      productId: entity.productId,
      name: entity.name,
      weightGrams: Number(entity.weightGrams),
      printTimeHours: Number(entity.printTimeHours),
      filamentCost: Number(entity.filamentCost),
      energyCost: Number(entity.energyCost),
      maintenanceCost: Number(entity.maintenanceCost),
      totalCost: Number(entity.totalCost),
      usedFilamentCostPerGram: Number(entity.usedFilamentCostPerGram),
      usedEnergyCostPerHour: Number(entity.usedEnergyCostPerHour),
      usedMaintenanceCostPerHour: Number(entity.usedMaintenanceCostPerHour),
      createdAt: entity.createdAt,
      filaments: [], // Filaments are no longer stored by ID, only characteristics
      partFilaments,
    });
  }
}
