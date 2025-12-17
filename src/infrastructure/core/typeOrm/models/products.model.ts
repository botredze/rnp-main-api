import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';
import { SalePlanSettingsModel } from '@/infrastructure/core/typeOrm/models/salePlanSettings.model';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';

export enum ProductStatuses {
  DELETED = 'deleted',
  ACTIVE = 'active',
}

@Entity({ name: 'products' })
export class ProductsModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column({ name: 'nmID' })
  nmID: number;

  @Column({ name: 'sku' })
  sku: string;

  @Column({ name: 'vendor_code' })
  vendorCode: string;

  @Column({ name: 'brand' })
  brand: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'video', nullable: true })
  video: string;

  @Column({ type: 'json', name: 'characteristics', nullable: true })
  characteristics: any;

  @Column({ type: 'json', name: 'sizes', nullable: true })
  sizes: any;

  @Column({ type: 'json', name: 'photos', nullable: true })
  photos: any;

  @ManyToOne(() => OrganizationsModel, (org) => org.products)
  @JoinColumn({ name: 'organization_id' })
  organization?: OrganizationsModel;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({
    type: 'enum',
    enum: ProductStatuses,
    default: ProductStatuses.ACTIVE,
    name: 'status',
  })
  status: ProductStatuses;

  @OneToMany(() => OrderModel, (order) => order.product)
  orders?: Array<OrderModel>;

  @OneToMany(() => SalesModel, (sale) => sale.product)
  sales?: Array<SalesModel>;

  @OneToMany(() => HistoryModel, (history) => history.product)
  histories?: Array<HistoryModel>;

  @OneToMany(() => StockCountModel, (stock) => stock.product)
  stockCounts?: Array<StockCountModel>;

  @OneToMany(() => ProductLogAndStrategyModel, (metric) => metric.product)
  metrics?: Array<ProductLogAndStrategyModel>;

  @OneToMany(() => SalePlanSettingsModel, (salePlan) => salePlan.product)
  salePlan?: Array<SalePlanSettingsModel>;

  @ManyToMany(() => AdvertisingModel, (ad) => ad.products)
  @JoinTable({ name: 'product_advertising' })
  advertisements?: Array<AdvertisingModel>;

  @OneToMany(() => StockCountOnSideModel, (stock) => stock.product)
  stockOnSide?: Array<StockCountOnSideModel>;

  @UpdateDateColumn({ name: 'updated_at' })
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

  metricsCalculated?: any;

  constructor(params: Partial<ProductsModel> = {}) {
    Object.assign(this, params);
  }
}
