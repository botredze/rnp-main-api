import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';

@Entity({name: 'organization_stocks'})
export class StocksModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'is_processing'})
  isProcessing: number;

  @Column({name: 'is_deleting'})
  isDeleting: number;

  @Column({name: 'stock_name'})
  stockName: string;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => OrganizationsModel, org => org.stocks)
  organization: OrganizationsModel;

  constructor(params: Partial<StocksModel> = {}) {
    Object.assign(this, params);
  }
}