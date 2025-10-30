import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
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
  @JoinColumn({name: 'app_statistic_id'})
  appStatistic: AdvertisingDayAppModel;

  @Column({name: 'app_statistic_id'})
  appStatisticId: number;

  @ManyToOne(() => ProductsModel)
  @JoinColumn({name: 'product_id'})
  product: ProductsModel;

  @Column({name: 'product_id'})
  productId: number;

  @UpdateDateColumn({ name: "updated_at" })
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


  constructor(params: Partial<AdvertisingDayAppNmModel> = {}) {
    Object.assign(this, params);
  }
}
