import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'schedular_tasks' })
export class SchedularTasksModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'schedule_rule' })
  scheduleRule: string;

  @Column({ name: 'last_run_time', nullable: true })
  lastRunTime: Date;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'status' })
  status: string;

  @Column({ name: 'run_after', nullable: true })
  runAfter: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<SchedularTasksModel> = {}) {
    Object.assign(this, params);
  }
}
