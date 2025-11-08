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

@Entity({ name: 'product_log_and_strategy' })
export class ProductLogAndStrategyModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column({ name: 'date', type: 'date' })
  date: Date;

  @Column({ name: 'strategy', type: 'text', nullable: true })
  strategy: string;

  @Column({ name: 'log', type: 'text', nullable: true })
  log: string;

  @Column({ name: 'sale_plan', type: 'int', nullable: true })
  salePlan: number;

  @ManyToOne(() => ProductsModel, (product) => product.metrics)
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

  constructor(params: Partial<ProductLogAndStrategyModel> = {}) {
    Object.assign(this, params);
  }
}
