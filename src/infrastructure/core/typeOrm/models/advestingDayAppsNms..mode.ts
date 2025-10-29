import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { ProductsModel } from './products.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';

@Entity({ name: 'advertising_day_app_nm' })
export class AdvertisingDayAppNmModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column()
  nmId: number;

  @Column({ default: 0 })
  atbs: number;

  @Column({ default: 0 })
  canceled: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ type: 'decimal', default: 0 })
  cpc: number;

  @Column({ type: 'decimal', default: 0 })
  ctr: number;

  @Column({ default: 0 })
  orders: number;

  @Column({ default: 0 })
  shks: number;

  @Column({ type: 'decimal', default: 0 })
  sum: number;

  @Column({ type: 'decimal', default: 0 })
  sum_price: number;

  @Column({ default: 0 })
  views: number;

  @ManyToOne(() => AdvertisingDayAppModel, app => app.nms)
  appStatistic: AdvertisingDayAppModel;

  @ManyToOne(() => ProductsModel)
  product: ProductsModel;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<AdvertisingDayAppNmModel> = {}) {
    Object.assign(this, params);
  }
}
