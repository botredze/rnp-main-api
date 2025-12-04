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
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

@Entity({ name: 'sale_plan_settings' })
export class SalePlanSettingsModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column({ name: 'start_period', nullable: true, type: 'date' })
  startPeriod: Date;

  @Column({ name: 'endPeriod', nullable: true, type: 'date' })
  endPeriod: Date;

  @Column({ name: 'saleCounts', nullable: true, default: 0 })
  saleCounts: number;

  @ManyToOne(() => ProductsModel, (product) => product.salePlan)
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

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

  constructor(params: Partial<SalePlanSettingsModel> = {}) {
    Object.assign(this, params);
  }
}
