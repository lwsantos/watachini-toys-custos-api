import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { FilamentEntity } from './FilamentEntity';

@Entity('filament_purchases')
export class FilamentPurchaseEntity {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string;

  @Column({ name: 'purchase_location', type: 'varchar', length: 255, nullable: true })
  purchaseLocation: string;

  @Column({ type: 'varchar', length: 100 })
  color: string;

  @Column({ name: 'filament_type', type: 'varchar', length: 100 })
  filamentType: string;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ name: 'purchase_date', type: 'timestamp' })
  purchaseDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => FilamentEntity, (filament) => filament.purchase)
  filaments: FilamentEntity[];
}
