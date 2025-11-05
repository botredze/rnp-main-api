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

@Entity({ name: 'stock_counts' })
export class StockCountModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'date' })
  date: Date;

  @Column({ name: 'log_warehouse_coef', type: 'decimal', nullable: true })
  logWarehouseCoef: number;

  @Column({ type: 'timestamp', name: 'last_change_date', nullable: true })
  lastChangeDate: Date;

  @Column({ name: 'warehouse_name', nullable: true })
  warehouseName: string;

  @Column({ name: 'supplier_article', nullable: true })
  supplierArticle: string;

  @Column({ name: 'nm_id', nullable: true })
  nmId: number;

  @Column({ name: 'barcode', nullable: true })
  barcode: string;

  @Column({ type: 'int', name: 'quantity', nullable: true })
  quantity: number;

  @Column({ type: 'int', name: 'in_way_to_client', nullable: true })
  inWayToClient: number;

  @Column({ type: 'int', name: 'in_way_from_client', nullable: true })
  inWayFromClient: number;

  @Column({ type: 'int', name: 'quantity_full', nullable: true })
  quantityFull: number;

  @Column({ name: 'category', nullable: true })
  category: string;

  @Column({ name: 'subject', nullable: true })
  subject: string;

  @Column({ name: 'brand', nullable: true })
  brand: string;

  @Column({ name: 'tech_size', nullable: true })
  techSize: string;

  @Column({ type: 'decimal', name: 'price', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', name: 'discount', precision: 5, scale: 2, nullable: true })
  discount: number;

  @Column({ name: 'is_supply', nullable: true })
  isSupply: boolean;

  @Column({ name: 'is_realization', nullable: true })
  isRealization: boolean;

  @Column({ name: 'sc_code', nullable: true })
  SCCode: string;

  @Column({ type: 'int', name: 'stock_count', nullable: true })
  stockCount: number;

  @Column({ type: 'decimal', name: 'stock_sum', precision: 12, scale: 2, nullable: true })
  stockSum: number;

  @Column({ type: 'decimal', name: 'avg_orders_by_mouth', precision: 8, scale: 2, nullable: true })
  avgOrdersByMouth: number;

  @Column({ type: 'json', name: 'metrics', nullable: true })
  metrics: any;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => ProductsModel, (product) => product.stockCounts)
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at', nullable: true })
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

  constructor(params: Partial<StockCountModel> = {}) {
    Object.assign(this, params);
  }
}
