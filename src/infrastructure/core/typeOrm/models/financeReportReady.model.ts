import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'finance_reports_ready' })
export class FinanceReportReadyModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

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

  constructor(params: Partial<FinanceReportReadyModel> = {}) {
    Object.assign(this, params);
  }
}
