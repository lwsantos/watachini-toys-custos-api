import { Order } from '../../../domain/entities';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';
import { ListOrdersDTO } from '../../dtos/ListOrdersDTO';

/**
 * Use case para listar pedidos com filtros opcionais
 * @see Requirements 8.1, 8.2, 8.6, 6.4, 7.10
 */
export class ListOrdersUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  /**
   * Executa a listagem de pedidos com filtros opcionais
   * @param filters Filtros opcionais de status do pedido e status de pagamento
   * @returns Lista de pedidos ordenada por data decrescente
   */
  async execute(filters?: ListOrdersDTO): Promise<OrderResponseDTO[]> {
    let orders: Order[];

    if (filters?.orderStatus) {
      // Filtrar por status do pedido
      orders = await this.orderRepository.findByStatus(filters.orderStatus);
    } else if (filters?.paymentStatus) {
      // Filtrar por status de pagamento
      orders = await this.orderRepository.findByPaymentStatus(filters.paymentStatus);
    } else {
      // Sem filtros, retornar todos
      orders = await this.orderRepository.findAll();
    }

    // Mapear para DTOs de resposta
    return orders.map(order => this.toResponseDTO(order));
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
