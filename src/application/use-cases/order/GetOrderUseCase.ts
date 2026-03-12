import { Order } from '../../../domain/entities';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';
import { NotFoundError } from './CreateOrderUseCase';

/**
 * Use case para obter um pedido por ID
 * @see Requirements 8.3
 */
export class GetOrderUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  /**
   * Executa a busca de um pedido por ID
   * @param id ID do pedido a ser buscado
   * @returns Dados completos do pedido
   * @throws NotFoundError se o pedido não existir
   */
  async execute(id: string): Promise<OrderResponseDTO> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundError(`Pedido com ID ${id} não encontrado`);
    }

    return this.toResponseDTO(order);
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
