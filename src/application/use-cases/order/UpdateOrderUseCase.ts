import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../../domain/entities';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository';
import { IProductRepository } from '../../../domain/repositories/IProductRepository';
import { UpdateOrderDTO, OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';
import { ValidationError, NotFoundError } from './CreateOrderUseCase';

/**
 * Use case para atualização de pedidos
 * @see Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */
export class UpdateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private customerRepository: ICustomerRepository,
    private productRepository: IProductRepository
  ) {}

  /**
   * Executa a atualização de um pedido existente
   * @param id ID do pedido a ser atualizado
   * @param dto Dados do pedido a serem atualizados
   * @returns Dados do pedido atualizado
   * @throws NotFoundError se o pedido ou cliente não existir
   * @throws ValidationError se os dados forem inválidos
   */
  async execute(id: string, dto: UpdateOrderDTO): Promise<OrderResponseDTO> {
    // Buscar pedido existente
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new NotFoundError(`Pedido com ID ${id} não encontrado`);
    }

    // Se customerId foi alterado, verificar se o novo cliente existe (Requirement 9.1)
    if (dto.customerId !== undefined && dto.customerId !== existingOrder.customerId) {
      if (!dto.customerId || dto.customerId.trim().length === 0) {
        throw new ValidationError('O cliente é obrigatório para criar um pedido');
      }
      const customer = await this.customerRepository.findById(dto.customerId);
      if (!customer) {
        throw new NotFoundError(`Cliente com ID ${dto.customerId} não encontrado`);
      }
      existingOrder.update({ customerId: dto.customerId, customer });
    }

    // Se itens foram alterados, processar novos itens (Requirements 9.2, 9.3, 9.4)
    if (dto.items !== undefined) {
      if (dto.items.length === 0) {
        throw new ValidationError('O pedido deve ter pelo menos um item');
      }

      const processedItems = await Promise.all(
        dto.items.map(async (item) => {
          const product = await this.productRepository.findById(item.productId);
          if (!product) {
            throw new NotFoundError(`Produto não encontrado: ${item.productId}`);
          }

          return {
            id: item.id || uuidv4(),
            orderId: id,
            productId: item.productId,
            productName: product.name,
            quantity: item.quantity,
            // Se não informado, usa o custo total do produto
            costPrice: item.costPrice ?? product.totalCost,
            // Se não informado, usa o preço final do produto
            salePrice: item.salePrice ?? product.finalPrice,
          };
        })
      );

      existingOrder.setItems(processedItems);
    }

    // Atualizar frete e datas (Requirements 9.5, 9.6)
    const updateProps: Parameters<typeof existingOrder.update>[0] = {};

    if (dto.shippingCost !== undefined) {
      updateProps.shippingCost = dto.shippingCost;
    }
    if (dto.shippingPaidBy !== undefined) {
      updateProps.shippingPaidBy = dto.shippingPaidBy;
    }
    if (dto.orderDate !== undefined) {
      updateProps.orderDate = dto.orderDate;
    }
    if (dto.expectedDeliveryDate !== undefined) {
      updateProps.expectedDeliveryDate = dto.expectedDeliveryDate;
    }

    // Aplicar atualizações se houver (recálculo automático acontece no update - Requirement 9.7)
    if (Object.keys(updateProps).length > 0) {
      existingOrder.update(updateProps);
    }

    // Salvar pedido atualizado
    const savedOrder = await this.orderRepository.update(existingOrder);

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
