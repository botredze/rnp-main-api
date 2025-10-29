import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @Column({ type: 'decimal', default: 0 })
  sum_price: number;

  @Column({ default: 0 })
  views: number;

  @ManyToOne(() => AdvertisingModel, ad => ad.dailyStatistics)
  advertising: AdvertisingModel;

  @OneToMany(() => AdvertisingDayAppModel, app => app.dayStatistic, { cascade: true })
  apps: Array<AdvertisingDayAppModel>;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<AdvertisingDayStatisticModel> = {}) {
    Object.assign(this, params);
  }
}
