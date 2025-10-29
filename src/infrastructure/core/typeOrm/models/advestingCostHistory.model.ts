import { CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, ManyToOne, Column } from 'typeorm';
import { AdvertisingModel } from './advertising.model';

@Entity({ name: 'advertising_cost_history' })
export class AdvertisingCostHistoryModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'upd_time' })
  updTime: Date;

  @Column({ name: 'upd_sum', type: 'decimal' })
  updSum: number;

  @Column({ name: 'advert_type' })
  advertType: number;

  @Column({ name: 'advert_status' })
  advertStatus: number;

  @Column({ name: 'camp_name' })
  campName: string;

  @ManyToOne(() => AdvertisingModel, ad => ad.costHistory)
  advertising: AdvertisingModel;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<AdvertisingCostHistoryModel> = {}) {
    Object.assign(this, params);
  }
}
