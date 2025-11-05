import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';

@Entity({ name: 'unit_economic_products' })
export class UnitEconomicProductsModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'vendor_code' })
  vendorCode: string;

  @Column({ name: 'price' })
  price: number;

  @Column({ name: 'sale_price' })
  salePrice: number;

  @Column({ name: 'ssp' })
  ssp: number;

  @Column({ name: 'price_with_ssp' })
  priceWithSpp: number;

  @Column({ name: 'wb_discount' })
  wbDiscount: number;

  @Column({ name: 'price_with_wb_discount' })
  priceWithWbDiscount: number;

  @ManyToOne(() => OrganizationsModel, (org) => org.stocks)
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationsModel;

  @OneToMany(() => UnitEconomicProductMetricsModel, (unitEconomicProduct) => unitEconomicProduct.productMetrics, {
    cascade: true,
  })
  tableData: Array<UnitEconomicProductMetricsModel>;

  @Column({ name: 'organization_id' })
  organizationId: number;

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

  constructor(params: Partial<UnitEconomicProductsModel> = {}) {
    Object.assign(this, params);
  }
}
