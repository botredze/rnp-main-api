import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

export interface WarehouseInfo {
  warehouseName: string;
  quantity: number;
}

@Entity({ name: 'stock_count_on_side' })
export class StockCountOnSideModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'nm_id', nullable: true })
  nmId: number;

  @Column({ name: 'barcode', nullable: true })
  barcode: string;

  @Column({ nullable: true, name: 'tech_size' })
  techSize: string;

  @Column({ nullable: true, name: 'brand' })
  brand: string;

  @Column({ nullable: true, name: 'subject' })
  subject: string;

  /** общее количество на складах WB */
  @Column({ type: 'int', default: 0, name: 'quantity_full' })
  quantityFull: number;

  /** в пути к клиенту */
  @Column({ type: 'int', default: 0, name: 'in_way_to_client' })
  inWayToClient: number;

  /** возвраты в пути */
  @Column({ type: 'int', default: 0, name: 'in_way_from_client' })
  inWayFromClient: number;

  /** список складов в виде JSON */
  @Column({ type: 'jsonb', nullable: true, name: 'warehouses' })
  warehouses: Array<WarehouseInfo>;

  /** связь с продуктом */
  @ManyToOne(() => ProductsModel, (product) => product.stockOnSide, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(params: Partial<StockCountOnSideModel> = {}) {
    Object.assign(this, params);
  }
}
