import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FilamentPurchaseEntity } from './FilamentPurchaseEntity';

export enum FilamentStatusEnum {
  AVAILABLE = 'available',
  EMPTY = 'empty',
}

@Entity('filaments')
export class FilamentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'purchase_id', type: 'uuid' })
  purchaseId: string;

  @Column({ type: 'varchar', length: 100 })
  color: string;

  @Column({ name: 'filament_type', type: 'varchar', length: 100 })
  filamentType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manufacturer: string;

  @Column({ name: 'cost_per_gram', type: 'decimal', precision: 10, scale: 2 })
  costPerGram: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: FilamentStatusEnum,
    default: FilamentStatusEnum.AVAILABLE,
  })
  status: FilamentStatusEnum;

  @Column({ name: 'purchase_date', type: 'timestamp' })
  purchaseDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => FilamentPurchaseEntity, (purchase) => purchase.filaments)
  @JoinColumn({ name: 'purchase_id' })
  purchase: FilamentPurchaseEntity;
}
