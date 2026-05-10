import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseEntity } from './PurchaseEntity';

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

  @Column({ name: 'cost_per_gram', type: 'decimal', precision: 10, scale: 4 })
  costPerGram: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  /** Valor unitário de catálogo da bobina, antes de ratear frete/desconto (multi-linha) */
  @Column({ name: 'unit_price_at_purchase', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPriceAtPurchase: number | null;

  @Column({
    type: 'enum',
    enum: FilamentStatusEnum,
    default: FilamentStatusEnum.AVAILABLE,
  })
  status: FilamentStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => PurchaseEntity, (purchase) => purchase.filaments)
  @JoinColumn({ name: 'purchase_id' })
  purchase: PurchaseEntity;
}
