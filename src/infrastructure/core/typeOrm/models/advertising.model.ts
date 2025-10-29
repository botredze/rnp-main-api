import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';

export enum AdvertisingTypes {
  ON_CATALOG = 4,
  ON_CARD = 5,
  ON_SEARCH = 6,
  ON_START_PAGE = 7,
  FIAT_RATE = 8,
}

export enum AdvertisingStatuses {
  DELETED = 1,
  READY_TO_START = 4,
  FINISHED = 7,
  CANCELED = 8,
  ACTIVE = 9,
  PAUSED = 11,
}

@Entity({ name: 'advertising' })
export class AdvertisingModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'advert_id' })
  advertId: string;

  @Column({ name: 'advert_name' })
  advertName: string;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'status' })
  status: number;

  @Column({ name: 'type' })
  type: number;

  @ManyToOne(() => OrganizationsModel, org => org.advertisements)
  organization: OrganizationsModel;

  @ManyToMany(() => ProductsModel, product => product.advertisements)
  products: Array<ProductsModel>;

  @OneToMany(() => AdvertisingDayStatisticModel, day => day.advertising)
  dailyStatistics: Array<AdvertisingDayStatisticModel>;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<AdvertisingModel> = {}) {
    Object.assign(this, params);
  }
}
