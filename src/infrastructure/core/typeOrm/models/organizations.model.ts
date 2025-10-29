import {
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


@Entity({name: 'organization'})
export class OrganizationsModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: "organization_name"})
  organizationName: string;

  @Column({name: "api_key"})
  apiKey: string;

  @Column({name: 'created_date', type: 'timestamp'})
  createdDate: Date;

  @Column({name: 'is_active', type: 'boolean', default: true})
  isActive: boolean;

  @Column({name: 'payment_date', type: 'timestamp'})
  paymentDate: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => UserModel, user => user.organizations)
  user: UserModel;

  @OneToMany(() => ProductsModel, product => product.organization)
  products: Array<ProductsModel>;

  @OneToMany(() => StocksModel, stock => stock.organization)
  stocks: Array<StocksModel>;

  @OneToMany(() => AdvertisingModel, ad => ad.organization)
  advertisements: Array<AdvertisingModel>;

  constructor(params: Partial<OrganizationsModel> = {}) {
    Object.assign(this, params);
  }
}