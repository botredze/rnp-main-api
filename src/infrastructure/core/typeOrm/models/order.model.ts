import { CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, Column, ManyToOne } from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

@Entity({ name: "orders" })
export class OrderModel {

  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'date' })
  date: Date;

  @Column({ name: 'nm_id' })
  nmId: string;

  @Column({ type: 'timestamp', name: 'last_change_date' })
  lastChangeDate: Date;

  @Column({ name: 'income_id' })
  incomeID: string;

  @Column({ name: 'is_supply' })
  isSupply: boolean;

  @Column({ name: 'is_realization' })
  isRealization: boolean;

  @Column({ type: 'decimal', name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', name: 'discount_percent', nullable: true })
  discountPercent: number;

  @Column({ name: 'spp', nullable: true })
  spp: string;

  @Column({ type: 'decimal', name: 'finished_price', nullable: true })
  finishedPrice: number;

  @Column({ type: 'decimal', name: 'price_with_disc', nullable: true })
  priceWithDisc: number;

  @Column({ name: 'is_cansel', default: false })
  isCansel: boolean;

  @Column({ type: 'timestamp', name: 'cancel_date', nullable: true })
  cancelDate: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductsModel, product => product.orders)
  product: ProductsModel;

  constructor(params: Partial<OrderModel> = {}) {
    Object.assign(this, params);
  }

}
