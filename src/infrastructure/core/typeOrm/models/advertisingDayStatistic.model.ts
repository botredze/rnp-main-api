import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { AdvertisingModel } from './advertising.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';

@Entity({ name: 'advertising_day_statistic' })
export class AdvertisingDayStatisticModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'date' })
  date: Date;

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

  @Column({ type: 'decimal', default: 0, name: 'sum_price'})
  sumPrice: number;

  @Column({ default: 0 })
  views: number;

  @ManyToOne(() => AdvertisingModel, ad => ad.dailyStatistics)
  @JoinColumn({name: 'advertising_id'})
  advertising: AdvertisingModel;

  @Column({name: 'advertising_id'})
  advertisingId: number;

  @OneToMany(() => AdvertisingDayAppModel, app => app.dayStatistic, { cascade: true })
  apps: Array<AdvertisingDayAppModel>;

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


  constructor(params: Partial<AdvertisingDayStatisticModel> = {}) {
    Object.assign(this, params);
  }
}
