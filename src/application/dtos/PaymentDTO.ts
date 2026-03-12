import { PaymentStatus, PaymentMethod } from '../../domain/entities/OrderEnums';

/**
 * DTO for updating payment information on an order
 * Validates: Requirements 7.1, 7.2, 7.3, 7.5, 7.6
 * 
 * Note: When paymentStatus is 'Pago', paymentMethod and paymentDate are required.
 * This validation is performed in the use case (UpdatePaymentStatusUseCase), not in the DTO.
 */
export interface UpdatePaymentDTO {
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
}
