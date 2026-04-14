import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
  ONE_TIME = 'ONE_TIME',
  PLANNED = 'PLANNED',
}

export enum PriceApplicationType {
  PRODUCT = 'PRODUCT', // Для всего продукта
  SIZE = 'SIZE', // Для конкретного размера
}

@Entity({ name: 'product_cost_prices' })
@Index(['productId', 'size', 'date', 'status'], { unique: true, where: "status = 'ACTIVE'" })
export class ProductCostPriceModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ManyToOne(() => ProductsModel, (product) => product.costPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({
    type: 'enum',
    enum: PriceApplicationType,
    default: PriceApplicationType.PRODUCT,
    name: 'application_type',
  })
  applicationType: PriceApplicationType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price' })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fulfillment: number;

  @Column({ nullable: true })
  size: string;

  @Column({
    type: 'enum',
    enum: OperationType,
    default: OperationType.ONE_TIME,
    name: 'operation_type',
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
  validateAndSetDefaults() {
    if (this.applicationType === PriceApplicationType.SIZE && !this.size) {
      throw new Error('Size must be provided when applicationType is SIZE');
    }

    if (this.applicationType === PriceApplicationType.PRODUCT && this.size) {
      this.size = null;
    }

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  validateAndUpdate() {
    if (this.applicationType === PriceApplicationType.SIZE && !this.size) {
      throw new Error('Size must be provided when applicationType is SIZE');
    }

    if (this.applicationType === PriceApplicationType.PRODUCT && this.size) {
      this.size = null;
    }

    this.updatedAt = new Date();
  }

  constructor(params: Partial<ProductCostPriceModel> = {}) {
    Object.assign(this, params);
  }
}
