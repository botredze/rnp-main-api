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

@Entity({ name: 'stock_count_on_side' })
export class StockCountOnSideModel {
  @PrimaryGeneratedColumn()
  id: number;

  /** дата среза */
  @Column({ type: 'date' })
  date: Date;

  /** nmId из WB */
  @Column()
  nmId: number;

  @Column({ nullable: true })
  techSize: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  subject: string;

  /** общее количество на складах WB */
  @Column({ type: 'int', default: 0 })
  quantityFull: number;

  /** в пути к клиенту */
  @Column({ type: 'int', default: 0 })
  inWayToClient: number;

  /** возвраты в пути */
  @Column({ type: 'int', default: 0 })
  inWayFromClient: number;

  /** список складов строкой (для быстрого просмотра) */
  @Column({ type: 'text', nullable: true })
  warehouseNames: string;

  /** связь с продуктом */
  @ManyToOne(() => ProductsModel, (product) => product.stockOnSide, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column()
  productId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(params: Partial<StockCountOnSideModel> = {}) {
    Object.assign(this, params);
  }
}
