import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { FilamentEntity } from './FilamentEntity';

@Entity('filament_purchases')
export class PurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freight: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ name: 'purchase_date', type: 'timestamp' })
  purchaseDate: Date;

  @Column({ name: 'purchase_location', type: 'varchar', length: 255, nullable: true })
  purchaseLocation: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => FilamentEntity, (filament) => filament.purchase)
  filaments: FilamentEntity[];
}
