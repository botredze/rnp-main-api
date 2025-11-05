import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';

@Entity({ name: 'unit_economic_product_metrics' })
export class UnitEconomicProductMetricsModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  label: string;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  percent: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  value: number | null;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value !== null ? parseFloat(value) : null),
    },
  })
  percentOfPrice: number | null;

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

  @ManyToOne(() => UnitEconomicProductsModel, (unitEconomicProduct) => unitEconomicProduct.tableData)
  @JoinColumn({ name: 'unit_economic_product_id' })
  productMetrics: UnitEconomicProductsModel;

  @Column({ name: 'unit_economic_product_id' })
  unitEconomicProductId: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<UnitEconomicProductMetricsModel> = {}) {
    Object.assign(this, params);
  }
}
