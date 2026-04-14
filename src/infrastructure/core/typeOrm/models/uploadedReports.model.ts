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

@Entity({ name: 'uploaded_reports' })
@Index(['organizationId', 'fileHash'], { unique: true })
export class UploadedReportModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'file_hash', length: 64 })
  fileHash: string; // SHA256 хеш файла

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'report_type' }) // 'weekly' | 'detailed'
  reportType: string;

  @Column({ name: 'records_count' })
  recordsCount: number;

  @Column({ name: 'duplicates_skipped', default: 0 })
  duplicatesSkipped: number;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.uploadedAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<UploadedReportModel> = {}) {
    Object.assign(this, params);
  }
}
