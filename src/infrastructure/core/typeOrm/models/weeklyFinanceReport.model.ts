import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'weekly_finance_reports' })
@Index(['organizationId', 'startDate', 'endDate'])
export class WeeklyFinanceReportModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'report_number', type: 'varchar' })
  reportNumber: string;

  @Column({ name: 'legal_entity', type: 'varchar' })
  legalEntity: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  @Column({ name: 'formation_date', type: 'date' })
  formationDate: Date;

  @Column({ name: 'report_type', type: 'varchar' })
  reportType: string;

  // Финансовые показатели
  @Column({ name: 'sales', type: 'numeric', default: 0 })
  sales: number;

  @Column({ name: 'loyalty_compensation', type: 'numeric', default: 0 })
  loyaltyCompensation: number;

  @Column({ name: 'to_transfer', type: 'numeric', default: 0 })
  toTransfer: number;

  @Column({ name: 'agreed_discount', type: 'numeric', default: 0 })
  agreedDiscount: number;

  @Column({ name: 'logistics_cost', type: 'numeric', default: 0 })
  logisticsCost: number;

  @Column({ name: 'storage_cost', type: 'numeric', default: 0 })
  storageCost: number;

  @Column({ name: 'acceptance_cost', type: 'numeric', default: 0 })
  acceptanceCost: number;

  @Column({ name: 'other_charges', type: 'numeric', default: 0 })
  otherCharges: number;

  @Column({ name: 'total_fines', type: 'numeric', default: 0 })
  totalFines: number;

  @Column({ name: 'vv_correction', type: 'numeric', default: 0 })
  vvCorrection: number;

  @Column({ name: 'loyalty_program_cost', type: 'numeric', default: 0 })
  loyaltyProgramCost: number;

  @Column({ name: 'loyalty_points_deduction', type: 'numeric', default: 0 })
  loyaltyPointsDeduction: number;

  @Column({ name: 'payment_term_change', type: 'numeric', default: 0 })
  paymentTermChange: number;

  @Column({ name: 'total_to_pay', type: 'numeric', default: 0 })
  totalToPay: number;

  @Column({ name: 'currency', type: 'varchar', default: 'KGS' })
  currency: string;

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

  constructor(params: Partial<WeeklyFinanceReportModel> = {}) {
    Object.assign(this, params);
  }
}
