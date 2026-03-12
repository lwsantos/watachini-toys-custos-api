import { Order } from '../../../domain/entities';
import { PaymentStatus } from '../../../domain/entities/OrderEnums';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { UpdatePaymentDTO } from '../../dtos/PaymentDTO';
import { OrderResponseDTO, OrderItemResponseDTO } from '../../dtos/OrderDTO';
import { NotFoundError, ValidationError } from './CreateOrderUseCase';

/**
 * Use case para atualizar o status de pagamento de um pedido
 * @see Requirements 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8
 */
export class UpdatePaymentStatusUseCase {
  constructor(private orderRepository: IOrderRepository) {}

  /**
   * Executa a atualização do status de pagamento do pedido
   * @param id ID do pedido a ser atualizado
   * @param dto Dados de pagamento a serem atualizados
   * @returns Dados completos do pedido atualizado
   * @throws NotFoundError se o pedido não existir
   * @throws ValidationError se o status for Pago e data ou método não estiverem preenchidos
   */
  async execute(id: string, dto: UpdatePaymentDTO): Promise<OrderResponseDTO> {
    // 1. Find existing order by ID
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundError(`Pedido com ID ${id} não encontrado`);
    }

    // 2. Validate required fields when status is 'Pago'
    if (dto.paymentStatus === PaymentStatus.PAID) {
      // Requirement 7.5, 7.7: paymentDate is required when status is Pago
      if (!dto.paymentDate) {
        throw new ValidationError('A data de pagamento é obrigatória quando o status é Pago');
      }

      // Requirement 7.6, 7.8: paymentMethod is required when status is Pago
      if (!dto.paymentMethod) {
        throw new ValidationError('O método de pagamento é obrigatório quando o status é Pago');
      }
    }

    // 3. Update order payment info using domain entity's update method
    order.update({
      paymentStatus: dto.paymentStatus,
      paymentMethod: dto.paymentMethod ?? null,
      paymentDate: dto.paymentDate ?? null,
    });

    // 4. Save via IOrderRepository
    const updatedOrder = await this.orderRepository.update(order);

    // 5. Return OrderResponseDTO
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
