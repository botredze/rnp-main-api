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

  @Column({ name: 'stock_id' })
  stockId: number;

  @Column({ name: 'office_id' })
  officeId: number;

  @Column({ name: 'delivery_type' })
  deliveryType: number;

  @Column({ name: 'cargo_type' })
  cargoType: number;

  @Column({ name: 'is_processing', type: 'boolean', default: true })
  isProcessing: boolean;

  @Column({ name: 'is_deleting', type: 'boolean', default: false })
  isDeleting: boolean;

  @Column({ name: 'stock_name' })
  stockName: string;

  @ManyToOne(() => OrganizationsModel, (org) => org.stocks)
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationsModel;

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

  constructor(params: Partial<StocksModel> = {}) {
    Object.assign(this, params);
  }
}
