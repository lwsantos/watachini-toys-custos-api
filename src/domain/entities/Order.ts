/**
 * Entidade de domínio Order - representa um pedido de venda no sistema
 * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { ValidationError } from './Customer';
import { Customer } from './Customer';
import { OrderItem, OrderItemProps } from './OrderItem';
import { OrderStatus, PaymentStatus, PaymentMethod, ShippingPaidBy } from './OrderEnums';

export interface OrderProps {
  id?: string;
  customerId: string;
  customer?: Customer;
  items: OrderItemProps[];
  orderDate?: Date;
  expectedDeliveryDate?: Date | null;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  paymentDate?: Date | null;
  shippingCost?: number;
  shippingPaidBy?: ShippingPaidBy;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Order {
  id: string;
  customerId: string;
  customer: Customer | null;
  items: OrderItem[];
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

  constructor(props: OrderProps) {
    this.id = props.id || '';
    this.customerId = props.customerId;
    this.customer = props.customer || null;
    this.items = props.items.map(item => new OrderItem(item));
    this.orderDate = props.orderDate || new Date();
    this.expectedDeliveryDate = props.expectedDeliveryDate ?? null;
    this.orderStatus = props.orderStatus || OrderStatus.PENDING;
    this.paymentStatus = props.paymentStatus || PaymentStatus.PENDING;
    this.paymentMethod = props.paymentMethod ?? null;
    this.paymentDate = props.paymentDate ?? null;
    this.shippingCost = props.shippingCost ?? 0;
    this.shippingPaidBy = props.shippingPaidBy || ShippingPaidBy.CUSTOMER;
    this.totalCost = 0;
    this.totalSaleValue = 0;
    this.profit = 0;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
    this.calculateTotals();
  }

  /**
   * Valida os dados do pedido
   * @throws ValidationError se os dados forem inválidos
   */
  private validate(): void {
    if (!this.customerId || this.customerId.trim().length === 0) {
      throw new ValidationError('O cliente é obrigatório para criar um pedido');
    }

    if (!this.items || this.items.length === 0) {
      throw new ValidationError('O pedido deve ter pelo menos um item');
    }
  }

  /**
   * Calcula os totais do pedido e o lucro
   * - totalCost = soma de (costPrice × quantity) de todos os itens + frete (se pago pela empresa)
   * - totalSaleValue = soma de (salePrice × quantity) de todos os itens
   * - profit = totalSaleValue - totalCost
   * @see Requirements 5.1, 5.2, 5.3, 5.4, 5.6
   */
  private calculateTotals(): void {
    // Calcula o custo total dos itens (Requirement 5.1)
    const itemsCost = this.items.reduce((sum, item) => sum + item.totalCost, 0);

    // Calcula o valor total de venda (Requirement 5.2)
    this.totalSaleValue = this.items.reduce((sum, item) => sum + item.totalSaleValue, 0);

    // Adiciona frete ao custo se pago pela empresa (Requirements 5.3, 4.3, 4.4)
    if (this.shippingPaidBy === ShippingPaidBy.COMPANY) {
      this.totalCost = itemsCost + this.shippingCost;
    } else {
      this.totalCost = itemsCost;
    }

    // Calcula o lucro (Requirement 5.4)
    this.profit = this.totalSaleValue - this.totalCost;
  }

  /**
   * Adiciona um item ao pedido e recalcula os totais
   * @param itemProps Propriedades do item a ser adicionado
   * @see Requirements 5.6, 9.2
   */
  addItem(itemProps: OrderItemProps): void {
    const item = new OrderItem({ ...itemProps, orderId: this.id });
    this.items.push(item);
    this.updatedAt = new Date();
    this.calculateTotals();
  }

  /**
   * Remove um item do pedido pelo ID e recalcula os totais
   * @param itemId ID do item a ser removido
   * @throws ValidationError se o pedido ficar sem itens
   * @see Requirements 5.6, 9.3
   */
  removeItem(itemId: string): void {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index !== -1) {
      this.items.splice(index, 1);
      if (this.items.length === 0) {
        throw new ValidationError('O pedido deve ter pelo menos um item');
      }
      this.updatedAt = new Date();
      this.calculateTotals();
    }
  }

  /**
   * Atualiza um item do pedido e recalcula os totais
   * @param itemId ID do item a ser atualizado
   * @param props Propriedades a serem atualizadas
   * @see Requirements 5.6, 9.4
   */
  updateItem(itemId: string, props: Partial<Omit<OrderItemProps, 'id' | 'orderId' | 'createdAt'>>): void {
    const item = this.items.find(item => item.id === itemId);
    if (item) {
      item.update(props);
      this.updatedAt = new Date();
      this.calculateTotals();
    }
  }

  /**
   * Atualiza os dados do pedido e recalcula os totais
   * @param props Propriedades a serem atualizadas
   * @throws ValidationError se os dados forem inválidos
   * @see Requirements 5.6, 9.5, 9.6, 9.7
   */
  update(props: Partial<Omit<OrderProps, 'id' | 'createdAt' | 'items'>>): void {
    if (props.customerId !== undefined) {
      this.customerId = props.customerId;
    }
    if (props.customer !== undefined) {
      this.customer = props.customer;
    }
    if (props.orderDate !== undefined) {
      this.orderDate = props.orderDate;
    }
    if (props.expectedDeliveryDate !== undefined) {
      this.expectedDeliveryDate = props.expectedDeliveryDate;
    }
    if (props.orderStatus !== undefined) {
      this.orderStatus = props.orderStatus;
    }
    if (props.paymentStatus !== undefined) {
      this.paymentStatus = props.paymentStatus;
    }
    if (props.paymentMethod !== undefined) {
      this.paymentMethod = props.paymentMethod;
    }
    if (props.paymentDate !== undefined) {
      this.paymentDate = props.paymentDate;
    }
    if (props.shippingCost !== undefined) {
      this.shippingCost = props.shippingCost;
    }
    if (props.shippingPaidBy !== undefined) {
      this.shippingPaidBy = props.shippingPaidBy;
    }

    this.updatedAt = new Date();
    this.validate();
    this.calculateTotals();
  }

  /**
   * Substitui todos os itens do pedido e recalcula os totais
   * @param itemsProps Array de propriedades dos novos itens
   * @throws ValidationError se o array estiver vazio
   * @see Requirements 5.6, 9.2, 9.3
   */
  setItems(itemsProps: OrderItemProps[]): void {
    if (!itemsProps || itemsProps.length === 0) {
      throw new ValidationError('O pedido deve ter pelo menos um item');
    }
    this.items = itemsProps.map(item => new OrderItem({ ...item, orderId: this.id }));
    this.updatedAt = new Date();
    this.calculateTotals();
  }

  /**
   * Recalcula os totais do pedido (método público para forçar recálculo)
   * @see Requirements 5.6
   */
  recalculate(): void {
    this.calculateTotals();
  }
}
