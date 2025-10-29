import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';


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

  constructor(params: Partial<OrganizationsModel> = {}) {
    Object.assign(this, params);
  }
}