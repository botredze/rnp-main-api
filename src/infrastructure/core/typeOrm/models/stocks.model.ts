import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';

@Entity({ name: 'organization_stocks' })
export class StocksModel {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ name: 'stock_external_id', type: 'int' })
  stockExternalId: number;

  @Column({ name: 'office_id', type: 'int' })
  officeId: number;

  @Column({ name: 'address', type: 'text' })
  address: string;

  @Column({ name: 'stock_name', type: 'varchar' })
  stockName: string;

  @Column({ name: 'city', type: 'varchar', nullable: true })
  city?: string;

  @Column({ name: 'longitude', type: 'float', nullable: true })
  longitude?: number;

  @Column({ name: 'latitude', type: 'float', nullable: true })
  latitude?: number;

  @Column({ name: 'delivery_type', type: 'int' })
  deliveryType: number;

  @Column({ name: 'cargo_type', type: 'int' })
  cargoType: number;

  @Column({ name: 'federal_district', type: 'varchar', nullable: true })
  federalDistrict?: string;

  @Column({ name: 'selected', type: 'boolean', default: false })
  selected: boolean;

  @ManyToOne(() => OrganizationsModel, (org) => org.stocks)
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationsModel;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'is_processing', type: 'boolean', default: true })
  isProcessing: boolean;

  @Column({ name: 'is_deleting', type: 'boolean', default: false })
  isDeleting: boolean;

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

  constructor(params: Partial<StocksModel> = {}) {
    Object.assign(this, params);
  }
}
