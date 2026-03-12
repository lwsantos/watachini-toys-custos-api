import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { CustomerEntity } from './CustomerEntity';
import type { OrderItemEntity } from './OrderItemEntity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne('CustomerEntity', (customer: CustomerEntity) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Column({ name: 'order_date', type: 'timestamp' })
  orderDate: Date;

  @Column({ name: 'expected_delivery_date', type: 'timestamp', nullable: true })
  expectedDeliveryDate: Date | null;

  @Column({ name: 'order_status', type: 'varchar', length: 50, default: 'Pendente' })
  orderStatus: string;

  @Column({ name: 'payment_status', type: 'varchar', length: 50, default: 'Pendente' })
  paymentStatus: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod: string | null;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate: Date | null;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ name: 'shipping_paid_by', type: 'varchar', length: 50, default: 'Cliente' })
  shippingPaidBy: string;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'total_sale_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSaleValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  profit: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany('OrderItemEntity', (item: OrderItemEntity) => item.order, { cascade: true })
  items: OrderItemEntity[];
}
