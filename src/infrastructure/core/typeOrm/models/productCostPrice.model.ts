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

export enum ProductCostPriceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export enum OperationType {
  ONE_TIME = 'ONE_TIME', // разовая
  PLANNED = 'PLANNED', // плановая
}

@Entity({ name: 'product_cost_prices' })
export class ProductCostPriceModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => ProductsModel, (product) => product.costPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fulfillment: number;

  @Column({ nullable: true })
  size: string;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.ONE_TIME,
  })
  operationType: OperationType;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    type: 'enum',
    enum: ProductCostPriceStatus,
    default: ProductCostPriceStatus.ACTIVE,
  })
  status: ProductCostPriceStatus;

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

  constructor(params: Partial<ProductCostPriceModel> = {}) {
    Object.assign(this, params);
  }
}
