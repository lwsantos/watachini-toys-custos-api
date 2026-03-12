import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cost_configurations')
export class CostConfigurationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'energy_cost_per_kwh', type: 'decimal', precision: 10, scale: 4 })
  energyCostPerKwh: number;

  @Column({ name: 'printer_power_kwh', type: 'decimal', precision: 10, scale: 4, default: 0.2 })
  printerPowerKwh: number;

  @Column({ name: 'labor_cost_per_hour', type: 'decimal', precision: 10, scale: 2 })
  laborCostPerHour: number;

  @Column({ name: 'maintenance_cost_per_hour', type: 'decimal', precision: 10, scale: 2 })
  maintenanceCostPerHour: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
