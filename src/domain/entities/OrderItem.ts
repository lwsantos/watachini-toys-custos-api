/**
 * Entidade de domínio OrderItem - representa um item de pedido no sistema
 * @see Requirements 3.5, 3.6
 */

import { ValidationError } from './Customer';

export interface OrderItemProps {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
  createdAt?: Date;
}

export class OrderItem {
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

  constructor(props: OrderItemProps) {
    this.id = props.id || '';
    this.orderId = props.orderId || '';
    this.productId = props.productId;
    this.productName = props.productName;
    this.quantity = props.quantity;
    this.costPrice = props.costPrice;
    this.salePrice = props.salePrice;
    this.createdAt = props.createdAt || new Date();

    this.validate();
    this.calculateTotals();
  }

  /**
   * Valida os dados do item do pedido
   * @throws ValidationError se os dados forem inválidos
   */
  private validate(): void {
    if (!this.productId || this.productId.trim().length === 0) {
      throw new ValidationError('O ID do produto é obrigatório');
    }

    if (!this.productName || this.productName.trim().length === 0) {
      throw new ValidationError('O nome do produto é obrigatório');
    }

    if (this.quantity <= 0) {
      throw new ValidationError('A quantidade deve ser maior que zero');
    }

    if (this.costPrice < 0) {
      throw new ValidationError('Os valores de custo e venda devem ser maiores ou iguais a zero');
    }

    if (this.salePrice < 0) {
      throw new ValidationError('Os valores de custo e venda devem ser maiores ou iguais a zero');
    }
  }

  /**
   * Calcula os totais do item
   * totalCost = costPrice × quantity
   * totalSaleValue = salePrice × quantity
   * @see Requirements 3.5, 3.6
   */
  private calculateTotals(): void {
    this.totalCost = this.costPrice * this.quantity;
    this.totalSaleValue = this.salePrice * this.quantity;
  }

  /**
   * Atualiza os dados do item do pedido e recalcula os totais
   * @param props Propriedades a serem atualizadas
   * @throws ValidationError se os dados forem inválidos
   */
  update(props: Partial<Omit<OrderItemProps, 'id' | 'orderId' | 'createdAt'>>): void {
    if (props.productId !== undefined) {
      this.productId = props.productId;
    }
    if (props.productName !== undefined) {
      this.productName = props.productName;
    }
    if (props.quantity !== undefined) {
      this.quantity = props.quantity;
    }
    if (props.costPrice !== undefined) {
      this.costPrice = props.costPrice;
    }
    if (props.salePrice !== undefined) {
      this.salePrice = props.salePrice;
    }

    this.validate();
    this.calculateTotals();
  }
}
