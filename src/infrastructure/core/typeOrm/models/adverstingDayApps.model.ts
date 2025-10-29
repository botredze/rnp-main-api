import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { AdvertisingDayStatisticModel } from './advertisingDayStatistic.model';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms..mode';

export enum AppTypes {
  SITE = 1,
  ANDROID = 32,
  IOS = 64,
}

@Entity({ name: 'advertising_day_app' })
export class AdvertisingDayAppModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'int' })
  appType: AppTypes;

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

  @ManyToOne(() => AdvertisingDayStatisticModel, day => day.apps)
  dayStatistic: AdvertisingDayStatisticModel;

  @OneToMany(() => AdvertisingDayAppNmModel, nm => nm.appStatistic, { cascade: true })
  nms: Array<AdvertisingDayAppNmModel>;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<AdvertisingDayAppModel> = {}) {
    Object.assign(this, params);
  }
}
