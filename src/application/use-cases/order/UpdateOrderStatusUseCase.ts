import { Order } from '../../../domain/entities';
import { OrderStatus } from '../../../domain/entities/OrderEnums';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';
import { NotFoundError } from './CreateOrderUseCase';

/**
 * Use case para atualizar o status de um pedido
 * @see Requirements 6.1
 */
export class UpdateOrderStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  /**
   * Executa a atualização do status do pedido
   * @param id ID do pedido a ser atualizado
   * @param status Novo status do pedido
   * @returns Dados completos do pedido atualizado
   * @throws NotFoundError se o pedido não existir
   */
  async execute(id: string, status: OrderStatus): Promise<OrderResponseDTO> {
    // 1. Find existing order by ID
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundError(`Pedido com ID ${id} não encontrado`);
    }

    // 2. Update order status using domain entity's update method
    order.update({ orderStatus: status });

    // 3. Save via IOrderRepository
    const updatedOrder = await this.orderRepository.update(order);

    // 4. Return OrderResponseDTO
    return this.toResponseDTO(updatedOrder);
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
