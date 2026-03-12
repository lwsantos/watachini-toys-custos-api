import { OrderStatus, PaymentStatus, PaymentMethod, ShippingPaidBy } from '../../domain/entities/OrderEnums';

/**
 * DTO for creating a new order item
 * Validates: Requirements 2.2, 3.1, 3.2
 */
export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
  costPrice?: number;  // Se não informado, usa o custo do produto
  salePrice?: number;  // Se não informado, usa o preço do produto
}

/**
 * DTO for updating an existing order item
 * Validates: Requirements 9.4
 */
export interface UpdateOrderItemDTO {
  id?: string;  // ID do item existente (para atualização)
  productId: string;
  quantity: number;
  costPrice?: number;
  salePrice?: number;
}

/**
 * DTO for order item response data
 * Validates: Requirements 3.5, 3.6
 */
export interface OrderItemResponseDTO {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  totalCost: number;
  totalSaleValue: number;
  createdAt: Date;
}

/**
 * DTO for creating a new order
 * Validates: Requirements 2.1, 2.2
 */
export interface CreateOrderDTO {
  customerId: string;
  items: CreateOrderItemDTO[];
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  shippingCost?: number;
  shippingPaidBy?: ShippingPaidBy;
}

/**
 * DTO for updating an existing order
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
export interface UpdateOrderDTO {
  customerId?: string;
  items?: UpdateOrderItemDTO[];
  orderDate?: Date;
  expectedDeliveryDate?: Date | null;
  shippingCost?: number;
  shippingPaidBy?: ShippingPaidBy;
}

/**
 * DTO for order response data
 * Validates: Requirements 8.2, 8.3
 */
export interface OrderResponseDTO {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItemResponseDTO[];
  orderDate: Date;
  expectedDeliveryDate: Date | null;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  paymentDate: Date | null;
  shippingCost: number;
  shippingPaidBy: ShippingPaidBy;
  totalCost: number;
  totalSaleValue: number;
  profit: number;
  createdAt: Date;
  updatedAt: Date;
}
