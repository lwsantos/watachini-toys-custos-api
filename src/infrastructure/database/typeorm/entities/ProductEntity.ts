import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductPartEntity } from './ProductPartEntity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'labor_time_minutes', type: 'int', default: 0 })
  laborTimeMinutes: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  @Column({ name: 'profit_margin', type: 'decimal', precision: 5, scale: 2, default: 0 })
  profitMargin: number;

  @Column({ name: 'final_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProductPartEntity, (part) => part.product, { cascade: true })
  parts: ProductPartEntity[];
}
