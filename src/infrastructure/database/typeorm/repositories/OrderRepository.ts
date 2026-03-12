import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { OrderEntity } from '../entities/OrderEntity';
import { OrderItemEntity } from '../entities/OrderItemEntity';
import { CustomerEntity } from '../entities/CustomerEntity';
import { IOrderRepository } from '../../../../domain/repositories/IOrderRepository';
import { Order, OrderItem, Customer, OrderStatus, PaymentStatus, PaymentMethod, ShippingPaidBy } from '../../../../domain/entities';

/**
 * Implementação TypeORM do repositório de pedidos
 * @see Requirements 2.1, 6.4, 7.10, 8.1, 8.6
 */
export class OrderRepository implements IOrderRepository {
  private repository: Repository<OrderEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(OrderEntity);
  }

  /**
   * Cria um novo pedido
   * @see Requirements 2.1
   */
  async create(order: Order): Promise<Order> {
    const entity = this.toEntity(order);
    const savedEntity = await this.repository.save(entity);
    
    // Reload with relations
    const reloadedEntity = await this.repository.findOne({
      where: { id: savedEntity.id },
      relations: ['customer', 'items'],
      order: { items: { createdAt: 'ASC' } },
    });
    
    return this.toDomain(reloadedEntity!);
  }

  /**
   * Busca um pedido pelo ID com todas as relações
   * @see Requirements 8.3
   */
  async findById(id: string): Promise<Order | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['customer', 'items'],
      order: { items: { createdAt: 'ASC' } },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Lista todos os pedidos cadastrados ordenados por data decrescente
   * @see Requirements 8.1, 8.6
   */
  async findAll(): Promise<Order[]> {
    const entities = await this.repository.find({
      relations: ['customer', 'items'],
      order: { orderDate: 'DESC', items: { createdAt: 'ASC' } },
    });
    return entities.map((entity) => this.toDomain(entity));
  }


  /**
   * Busca pedidos por status do pedido ordenados por data decrescente
   * @see Requirements 6.4, 8.6
   */
  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const entities = await this.repository.find({
      where: { orderStatus: status },
      relations: ['customer', 'items'],
      order: { orderDate: 'DESC', items: { createdAt: 'ASC' } },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Busca pedidos por status de pagamento ordenados por data decrescente
   * @see Requirements 7.10, 8.6
   */
  async findByPaymentStatus(status: PaymentStatus): Promise<Order[]> {
    const entities = await this.repository.find({
      where: { paymentStatus: status },
      relations: ['customer', 'items'],
      order: { orderDate: 'DESC', items: { createdAt: 'ASC' } },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  /**
   * Atualiza os dados de um pedido existente
   * @see Requirements 8.4
   */
  async update(order: Order): Promise<Order> {
    // First, delete existing items to handle item updates/removals
    await AppDataSource.getRepository(OrderItemEntity).delete({ orderId: order.id });
    
    // Save the order with new items
    const entity = this.toEntity(order);
    await this.repository.save(entity);
    
    // Reload with relations
    const updatedEntity = await this.repository.findOne({
      where: { id: order.id },
      relations: ['customer', 'items'],
      order: { items: { createdAt: 'ASC' } },
    });
    
    return this.toDomain(updatedEntity!);
  }

  /**
   * Remove um pedido pelo ID
   * @see Requirements 8.5
   */
  async delete(id: string): Promise<void> {
    // Items will be deleted by cascade
    await this.repository.delete(id);
  }


  /**
   * Converte entidade de domínio Order para entidade TypeORM OrderEntity
   */
  private toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id;
    entity.customerId = order.customerId;
    entity.orderDate = order.orderDate;
    entity.expectedDeliveryDate = order.expectedDeliveryDate;
    entity.orderStatus = order.orderStatus;
    entity.paymentStatus = order.paymentStatus;
    entity.paymentMethod = order.paymentMethod;
    entity.paymentDate = order.paymentDate;
    entity.shippingCost = order.shippingCost;
    entity.shippingPaidBy = order.shippingPaidBy;
    entity.totalCost = order.totalCost;
    entity.totalSaleValue = order.totalSaleValue;
    entity.profit = order.profit;
    
    if (order.createdAt) {
      entity.createdAt = order.createdAt;
    }
    if (order.updatedAt) {
      entity.updatedAt = order.updatedAt;
    }

    // Map items
    entity.items = order.items.map((item) => this.toItemEntity(item, order.id));

    return entity;
  }

  /**
   * Converte entidade de domínio OrderItem para entidade TypeORM OrderItemEntity
   */
  private toItemEntity(item: OrderItem, orderId: string): OrderItemEntity {
    const entity = new OrderItemEntity();
    entity.id = item.id;
    entity.orderId = orderId;
    entity.productId = item.productId;
    entity.productName = item.productName;
    entity.quantity = item.quantity;
    entity.costPrice = item.costPrice;
    entity.salePrice = item.salePrice;
    entity.totalCost = item.totalCost;
    entity.totalSaleValue = item.totalSaleValue;
    
    if (item.createdAt) {
      entity.createdAt = item.createdAt;
    }

    return entity;
  }


  /**
   * Converte entidade TypeORM OrderEntity para entidade de domínio Order
   */
  private toDomain(entity: OrderEntity): Order {
    const customer = entity.customer ? this.toCustomerDomain(entity.customer) : undefined;
    
    const items = (entity.items || []).map((itemEntity) => ({
      id: itemEntity.id,
      orderId: itemEntity.orderId,
      productId: itemEntity.productId,
      productName: itemEntity.productName,
      quantity: itemEntity.quantity,
      costPrice: Number(itemEntity.costPrice),
      salePrice: Number(itemEntity.salePrice),
      createdAt: itemEntity.createdAt,
    }));

    return new Order({
      id: entity.id,
      customerId: entity.customerId,
      customer: customer,
      items: items,
      orderDate: entity.orderDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      orderStatus: entity.orderStatus as OrderStatus,
      paymentStatus: entity.paymentStatus as PaymentStatus,
      paymentMethod: entity.paymentMethod as PaymentMethod | null,
      paymentDate: entity.paymentDate,
      shippingCost: Number(entity.shippingCost),
      shippingPaidBy: entity.shippingPaidBy as ShippingPaidBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Converte entidade TypeORM CustomerEntity para entidade de domínio Customer
   */
  private toCustomerDomain(entity: CustomerEntity): Customer {
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
