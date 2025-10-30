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

@Entity({ name: "history" })
export class HistoryModel {

  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'date' })
  date: Date;

  @Column({ type: 'int', name: 'open_card_count', default: 0 })
  openCardCount: number;

  @Column({ type: 'int', name: 'nm_id'})
  nmId: number;

  @Column({ type: 'int', name: 'add_to_card_count', default: 0 })
  addToCardCount: number;

  @Column({ type: 'int', name: 'orders_count', default: 0 })
  ordersCount: number;

  @Column({ type: 'decimal', name: 'order_sum_rub', precision: 12, scale: 2, default: 0 })
  orderSumRub: number;

  @Column({ type: 'int', name: 'buy_out_count', default: 0 })
  buyOutCount: number;

  @Column({ type: 'decimal', name: 'buy_out_sum_rub', precision: 12, scale: 2, default: 0 })
  buyOutSumRub: number;

  @Column({ type: 'decimal', name: 'buy_out_percent', precision: 12, scale: 2, default: 0 })
  buyOutPercent: number;

  @Column({ type: 'decimal', name: 'add_to_card_conversion', precision: 5, scale: 2, default: 0 })
  addToCardConversion: number;

  @Column({ type: 'decimal', name: 'card_to_order_conversion', precision: 5, scale: 2, default: 0 })
  cardToOrderConversion: number;

  @Column({ type: 'decimal', name: 'add_to_with_list', precision: 5, scale: 2, default: 0 })
  addToWishlist: number;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductsModel, product => product.histories)
  @JoinColumn({name: 'product_id'})
  product: ProductsModel;

  @Column({name: 'product_id'})
  productId: number;

  constructor(params: Partial<HistoryModel> = {}) {
    Object.assign(this, params);
  }
}
