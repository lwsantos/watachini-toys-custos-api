import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../../domain/entities';
import { OrderStatus, PaymentStatus, ShippingPaidBy } from '../../../domain/entities/OrderEnums';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { CreateOrderDTO, OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';

/**
 * Erro de validação para operações de pedido
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de entidade não encontrada
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Use case para criação de pedidos
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.7, 2.8, 3.1, 3.2, 5.1, 5.2, 5.3, 5.4
 */
export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private customerRepository: ICustomerRepository,
    private productRepository: IProductRepository
  ) {}

  /**
   * Executa a criação de um novo pedido
   * @param dto Dados do pedido a ser criado
   * @returns Dados do pedido criado
   * @throws ValidationError se o cliente ou itens não forem informados
   * @throws NotFoundError se o cliente ou produto não existir
   */
  async execute(dto: CreateOrderDTO): Promise<OrderResponseDTO> {
    // Validar cliente obrigatório (Requirement 2.7)
    if (!dto.customerId || dto.customerId.trim().length === 0) {
      throw new ValidationError('O cliente é obrigatório para criar um pedido');
    }

    // Validar itens obrigatórios (Requirement 2.8)
    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError('O pedido deve ter pelo menos um item');
    }

    // Verificar se o cliente existe (Requirement 2.1)
    const customer = await this.customerRepository.findById(dto.customerId);
    if (!customer) {
      throw new NotFoundError(`Cliente com ID ${dto.customerId} não encontrado`);
    }

    // Processar itens e buscar valores do produto se não informados (Requirements 3.1, 3.2)
    const processedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.productRepository.findById(item.productId);
        if (!product) {
          throw new NotFoundError(`Produto não encontrado: ${item.productId}`);
        }

        return {
          id: uuidv4(),
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          // Se não informado, usa o custo total do produto (Requirement 3.1)
          costPrice: item.costPrice ?? product.totalCost,
          // Se não informado, usa o preço final do produto (Requirement 3.2)
          salePrice: item.salePrice ?? product.finalPrice,
        };
      })
    );

    const now = new Date();
    const orderId = uuidv4();

    // Criar entidade Order com validações e cálculos automáticos
    // - Status inicial como Pendente (Requirement 2.3)
    // - Data do pedido como data corrente se não informada (Requirement 2.4)
    // - Cálculos de totais e lucro (Requirements 5.1, 5.2, 5.3, 5.4)
    const order = new Order({
      id: orderId,
      customerId: dto.customerId,
      customer: customer,
      items: processedItems.map(item => ({
        ...item,
        orderId: orderId,
      })),
      orderDate: dto.orderDate ?? now,
      expectedDeliveryDate: dto.expectedDeliveryDate ?? null,
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: null,
      paymentDate: null,
      shippingCost: dto.shippingCost ?? 0,
      shippingPaidBy: dto.shippingPaidBy ?? ShippingPaidBy.CUSTOMER,
      createdAt: now,
      updatedAt: now,
    });

    const savedOrder = await this.orderRepository.create(order);

    return this.toResponseDTO(savedOrder);
  }

  /**
   * Converte a entidade Order para OrderResponseDTO
   */
  private toResponseDTO(order: Order): OrderResponseDTO {
    const itemsDTO: OrderItemResponseDTO[] = order.items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      costPrice: item.costPrice,
      salePrice: item.salePrice,
      totalCost: item.totalCost,
      totalSaleValue: item.totalSaleValue,
      createdAt: item.createdAt,
    }));

    return {
      id: order.id,
      customerId: order.customerId,
      customerName: order.customer?.name ?? '',
      items: itemsDTO,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentDate: order.paymentDate,
      shippingCost: order.shippingCost,
      shippingPaidBy: order.shippingPaidBy,
      totalCost: order.totalCost,
      totalSaleValue: order.totalSaleValue,
      profit: order.profit,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
