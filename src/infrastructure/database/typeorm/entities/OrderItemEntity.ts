import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { OrderEntity } from './OrderEntity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne('OrderEntity', (order: OrderEntity) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'product_name', type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ name: 'sale_price', type: 'decimal', precision: 10, scale: 2 })
  salePrice: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ name: 'total_sale_value', type: 'decimal', precision: 10, scale: 2 })
  totalSaleValue: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
