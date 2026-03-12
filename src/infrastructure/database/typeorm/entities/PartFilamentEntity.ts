import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductPartEntity } from './ProductPartEntity';

@Entity('part_filaments')
export class PartFilamentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'part_id', type: 'uuid' })
  partId: string;

  @Column({ name: 'filament_type', type: 'varchar', length: 100 })
  filamentType: string;

  @Column({ type: 'varchar', length: 255 })
  manufacturer: string;

  @Column({ type: 'varchar', length: 100 })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductPartEntity, (part) => part.partFilaments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'part_id' })
  part: ProductPartEntity;
}
