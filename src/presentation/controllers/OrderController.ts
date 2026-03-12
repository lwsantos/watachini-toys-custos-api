import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateOrderUseCase,
  UpdateOrderUseCase,
  DeleteOrderUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  UpdateOrderStatusUseCase,
  UpdatePaymentStatusUseCase,
  ValidationError,
  NotFoundError,
} from '../../application/use-cases/order';
import { OrderStatus, PaymentStatus } from '../../domain/entities';
import {
  CustomerRepository,
  OrderRepository,
  ProductRepository,
} from '../../infrastructure/database/typeorm/repositories';

const router = Router();

// Instantiate repositories
const orderRepository = new OrderRepository();
const customerRepository = new CustomerRepository();
const productRepository = new ProductRepository();

// Instantiate use cases
const createOrderUseCase = new CreateOrderUseCase(
  orderRepository,
  customerRepository,
  productRepository
);
const updateOrderUseCase = new UpdateOrderUseCase(
  orderRepository,
  customerRepository,
  productRepository
);
const deleteOrderUseCase = new DeleteOrderUseCase(orderRepository);
const getOrderUseCase = new GetOrderUseCase(orderRepository);
const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
const updatePaymentStatusUseCase = new UpdatePaymentStatusUseCase(orderRepository);

// POST /api/orders - Criar pedido
// @see Requirements 2.1
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await createOrderUseCase.execute(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /api/orders - Listar pedidos com filtros opcionais
// @see Requirements 8.1, 6.4, 7.10
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderStatus, paymentStatus } = req.query;

    // Build filters from query parameters
    const filters: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus } = {};

    if (orderStatus && typeof orderStatus === 'string') {
      // Validate orderStatus is a valid enum value
      const validOrderStatuses = Object.values(OrderStatus);
      if (validOrderStatuses.includes(orderStatus as OrderStatus)) {
        filters.orderStatus = orderStatus as OrderStatus;
      }
    }

    if (paymentStatus && typeof paymentStatus === 'string') {
      // Validate paymentStatus is a valid enum value
      const validPaymentStatuses = Object.values(PaymentStatus);
      if (validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
        filters.paymentStatus = paymentStatus as PaymentStatus;
      }
    }

    const orders = await listOrdersUseCase.execute(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Obter pedido por ID
// @see Requirements 8.3
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await getOrderUseCase.execute(id);
    res.json(order);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// PUT /api/orders/:id - Atualizar pedido
// @see Requirements 8.4
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await updateOrderUseCase.execute(id, req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// DELETE /api/orders/:id - Excluir pedido
// @see Requirements 8.5
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verificar se o pedido existe antes de excluir
    const order = await orderRepository.findById(id);
    if (!order) {
      res.status(404).json({
        error: 'Not Found',
        message: `Pedido com ID ${id} não encontrado`,
      });
      return;
    }

    await deleteOrderUseCase.execute(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/orders/:id/status - Atualizar status do pedido
// @see Requirements 6.1
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'O status do pedido é obrigatório',
      });
      return;
    }

    // Validate orderStatus is a valid enum value
    const validOrderStatuses = Object.values(OrderStatus);
    if (!validOrderStatuses.includes(orderStatus as OrderStatus)) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Status inválido. Valores permitidos: ${validOrderStatuses.join(', ')}`,
      });
      return;
    }

    const result = await updateOrderStatusUseCase.execute(id, orderStatus as OrderStatus);
    res.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

// PATCH /api/orders/:id/payment - Atualizar status de pagamento
// @see Requirements 7.1
router.patch('/:id/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paymentDate } = req.body;

    if (!paymentStatus) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'O status de pagamento é obrigatório',
      });
      return;
    }

    // Validate paymentStatus is a valid enum value
    const validPaymentStatuses = Object.values(PaymentStatus);
    if (!validPaymentStatuses.includes(paymentStatus as PaymentStatus)) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Status de pagamento inválido. Valores permitidos: ${validPaymentStatuses.join(', ')}`,
      });
      return;
    }

    const result = await updatePaymentStatusUseCase.execute(id, {
      paymentStatus: paymentStatus as PaymentStatus,
      paymentMethod,
      paymentDate: paymentDate ? new Date(paymentDate) : undefined,
    });
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }
    next(error);
  }
});

export default router;
