import { Repository, ILike } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CustomerEntity } from '../entities/CustomerEntity';
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository';
import { Customer } from '../../../../domain/entities';

/**
 * Implementação TypeORM do repositório de clientes
 * @see Requirements 1.1, 1.4, 1.5, 1.6
 */
export class CustomerRepository implements ICustomerRepository {
  private repository: Repository<CustomerEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(CustomerEntity);
  }

  /**
   * Cria um novo cliente
   * @see Requirements 1.1
   */
  async create(customer: Customer): Promise<Customer> {
    const entity = this.toEntity(customer);
    const savedEntity = await this.repository.save(entity);
    return this.toDomain(savedEntity);
  }

  /**
   * Busca um cliente pelo ID
   */
  async findById(id: string): Promise<Customer | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Lista todos os clientes cadastrados
   * @see Requirements 1.5
   */
  async findAll(): Promise<Customer[]> {
    const entities = await this.repository.find({
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Busca clientes por nome (case-insensitive usando ILIKE)
   * @see Requirements 1.6
   */
  async findByName(name: string): Promise<Customer[]> {
    const entities = await this.repository.find({
      where: {
        name: ILike(`%${name}%`),
      },
      order: { createdAt: 'DESC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Atualiza os dados de um cliente existente
   * @see Requirements 1.4
   */
  async update(customer: Customer): Promise<Customer> {
    const entity = this.toEntity(customer);
    await this.repository.save(entity);
    
    const updatedEntity = await this.repository.findOne({
      where: { id: customer.id },
    });
    
    return this.toDomain(updatedEntity!);
  }

  /**
   * Remove um cliente pelo ID
   * @see Requirements 1.4
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Converte entidade de domínio para entidade TypeORM
   */
  private toEntity(customer: Customer): CustomerEntity {
    const entity = new CustomerEntity();
    entity.id = customer.id;
    entity.name = customer.name;
    entity.email = customer.email;
    entity.phone = customer.phone;
    
    if (customer.createdAt) {
      entity.createdAt = customer.createdAt;
    }
    if (customer.updatedAt) {
      entity.updatedAt = customer.updatedAt;
    }

    return entity;
  }

  /**
   * Converte entidade TypeORM para entidade de domínio
   */
  private toDomain(entity: CustomerEntity): Customer {
    return new Customer({
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
