import { OrderStatus, PaymentStatus } from '../../domain/entities';

/**
 * DTO for filtering orders in list operations
 * @see Requirements 6.4, 7.10
 */
export interface ListOrdersDTO {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}
