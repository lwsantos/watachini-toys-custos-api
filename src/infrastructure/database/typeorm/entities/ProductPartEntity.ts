import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductEntity } from './ProductEntity';
import { PartFilamentEntity } from './PartFilamentEntity';

@Entity('product_parts')
export class ProductPartEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'weight_grams', type: 'decimal', precision: 10, scale: 2 })
  weightGrams: number;

  @Column({ name: 'print_time_hours', type: 'decimal', precision: 10, scale: 2 })
  printTimeHours: number;

  // Calculated costs
  @Column({ name: 'filament_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  filamentCost: number;

  @Column({ name: 'energy_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  energyCost: number;

  @Column({ name: 'maintenance_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  maintenanceCost: number;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number;

  // Configuration snapshot values used in calculation
  @Column({ name: 'used_filament_cost_per_gram', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedFilamentCostPerGram: number;

  @Column({ name: 'used_energy_cost_per_hour', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedEnergyCostPerHour: number;

  @Column({ name: 'used_maintenance_cost_per_hour', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usedMaintenanceCostPerHour: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductEntity, (product) => product.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @OneToMany(() => PartFilamentEntity, (partFilament) => partFilament.part, { cascade: true })
  partFilaments: PartFilamentEntity[];
}
