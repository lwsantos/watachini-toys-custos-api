import { UpdatePaymentStatusUseCase } from './UpdatePaymentStatusUseCase';
import { ValidationError, NotFoundError } from './CreateOrderUseCase';
import { IOrderRepository } from '../../../domain/repositories/IOrderRepository';
import { Order, OrderProps } from '../../../domain/entities';
import { PaymentStatus, PaymentMethod, OrderStatus, ShippingPaidBy } from '../../../domain/entities/OrderEnums';
import { UpdatePaymentDTO } from '../../dtos/PaymentDTO';

describe('UpdatePaymentStatusUseCase', () => {
  let useCase: UpdatePaymentStatusUseCase;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  const createMockOrder = (overrides: Partial<OrderProps> = {}): Order => {
    return new Order({
      id: 'order-123',
      customerId: 'customer-123',
      items: [
        {
          id: 'item-1',
          orderId: 'order-123',
          productId: 'product-1',
          productName: 'Test Product',
          quantity: 2,
          costPrice: 10,
          salePrice: 20,
        },
      ],
      orderDate: new Date('2024-01-15'),
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      shippingCost: 15,
      shippingPaidBy: ShippingPaidBy.CUSTOMER,
      ...overrides,
    });
  };

  beforeEach(() => {
    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findByPaymentStatus: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    useCase = new UpdatePaymentStatusUseCase(mockOrderRepository);
  });

  describe('execute', () => {
    it('should throw NotFoundError when order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.PIX,
        paymentDate: new Date(),
      };

      await expect(useCase.execute('non-existent-id', dto)).rejects.toThrow(NotFoundError);
      await expect(useCase.execute('non-existent-id', dto)).rejects.toThrow(
        'Pedido com ID non-existent-id não encontrado'
      );
    });

    /**
     * Validates: Requirements 7.5, 7.7
     */
    it('should throw ValidationError when status is Pago and paymentDate is missing', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.PIX,
        // paymentDate is missing
      };

      await expect(useCase.execute('order-123', dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('order-123', dto)).rejects.toThrow(
        'A data de pagamento é obrigatória quando o status é Pago'
      );
    });

    /**
     * Validates: Requirements 7.6, 7.8
     */
    it('should throw ValidationError when status is Pago and paymentMethod is missing', async () => {
      const order = createMockOrder();
      mockOrderRepository.findById.mockResolvedValue(order);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date(),
        // paymentMethod is missing
      };

      await expect(useCase.execute('order-123', dto)).rejects.toThrow(ValidationError);
      await expect(useCase.execute('order-123', dto)).rejects.toThrow(
        'O método de pagamento é obrigatório quando o status é Pago'
      );
    });

    /**
     * Validates: Requirements 7.1, 7.2, 7.3
     */
    it('should update payment status to Pago with all required fields', async () => {
      const order = createMockOrder();
      const paymentDate = new Date('2024-01-20');
      
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockImplementation(async (o) => o);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.PIX,
        paymentDate: paymentDate,
      };

      const result = await useCase.execute('order-123', dto);

      expect(result.paymentStatus).toBe(PaymentStatus.PAID);
      expect(result.paymentMethod).toBe(PaymentMethod.PIX);
      expect(result.paymentDate).toEqual(paymentDate);
      expect(mockOrderRepository.update).toHaveBeenCalled();
    });

    it('should allow updating to Pendente status without paymentDate and paymentMethod', async () => {
      const order = createMockOrder({
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.PIX,
        paymentDate: new Date(),
      });
      
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockImplementation(async (o) => o);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PENDING,
      };

      const result = await useCase.execute('order-123', dto);

      expect(result.paymentStatus).toBe(PaymentStatus.PENDING);
      expect(mockOrderRepository.update).toHaveBeenCalled();
    });

    it('should return complete OrderResponseDTO with all fields', async () => {
      const order = createMockOrder();
      const paymentDate = new Date('2024-01-20');
      
      mockOrderRepository.findById.mockResolvedValue(order);
      mockOrderRepository.update.mockImplementation(async (o) => o);

      const dto: UpdatePaymentDTO = {
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        paymentDate: paymentDate,
      };

      const result = await useCase.execute('order-123', dto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('customerId');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('orderDate');
      expect(result).toHaveProperty('orderStatus');
      expect(result).toHaveProperty('paymentStatus');
      expect(result).toHaveProperty('paymentMethod');
      expect(result).toHaveProperty('paymentDate');
      expect(result).toHaveProperty('shippingCost');
      expect(result).toHaveProperty('shippingPaidBy');
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('totalSaleValue');
      expect(result).toHaveProperty('profit');
    });

    it('should support all payment methods', async () => {
      const paymentMethods = [
        PaymentMethod.PIX,
        PaymentMethod.CREDIT_CARD,
        PaymentMethod.DEBIT_CARD,
        PaymentMethod.TRANSFER,
      ];

      for (const method of paymentMethods) {
        const order = createMockOrder();
        mockOrderRepository.findById.mockResolvedValue(order);
        mockOrderRepository.update.mockImplementation(async (o) => o);

        const dto: UpdatePaymentDTO = {
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: method,
          paymentDate: new Date(),
        };

        const result = await useCase.execute('order-123', dto);
        expect(result.paymentMethod).toBe(method);
      }
    });
  });
});
