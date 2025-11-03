import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';

export enum OrganizationStatuses {
  Inited = 'inited',
  Active = 'active',
  Inactive = 'inactive',
  Deleted = 'deleted',
  Paused = 'paused',
  errorApiKey = 'errorApiKey',
}

@Entity({ name: 'organization' })
export class OrganizationsModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_name' })
  organizationName: string;

  @Column({ name: 'wb_organization_name', nullable: true })
  wbOrganizationName: string;

  @Column({ name: 'api_key' })
  apiKey: string;

  @Column({ name: 'sid', nullable: true })
  sid: string;

  @Column({ name: 'trade_mark', nullable: true })
  tradeMark: string;

  @Column({ name: 'created_date', type: 'timestamp' })
  createdDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'payment_date', type: 'timestamp' })
  paymentDate: Date;

  @Column({ name: 'status', type: 'enum', enum: OrganizationStatuses, default: OrganizationStatuses.Inited })
  status: OrganizationStatuses;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserModel, (user) => user.organizations)
  user?: UserModel;

  @OneToMany(() => ProductsModel, (product) => product.organization)
  products?: Array<ProductsModel>;

  @OneToMany(() => StocksModel, (stock) => stock.organization)
  stocks?: Array<StocksModel>;

  @OneToMany(() => UnitEconomicProductsModel, (unitEconomicProduct) => unitEconomicProduct.organization, {
    cascade: true,
  })
  unitEconomicProducts?: Array<UnitEconomicProductsModel>;

  @OneToMany(() => AdvertisingModel, (ad) => ad.organization)
  advertisements: Array<AdvertisingModel>;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<OrganizationsModel> = {}) {
    Object.assign(this, params);
  }
}
