import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

@Entity({ name: 'stock_counts' })
export class StockCountModel {

  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'date' })
  date: Date;

  @Column({ type: 'int', name: 'stock_count', default: 0 })
  stockCount: number;

  @Column({ type: 'decimal', name: 'stock_sum', precision: 12, scale: 2, default: 0 })
  stockSum: number;

  @Column({ type: 'decimal', name: 'avg_orders_by_mouth', precision: 8, scale: 2, default: 0 })
  avgOrdersByMouth: number;

  @Column({ type: 'json', name: 'metrics', nullable: true })
  metrics: any;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductsModel, product => product.stockCounts)
  product: ProductsModel;

  constructor(params: Partial<StockCountModel> = {}) {
    Object.assign(this, params);
  }
}
