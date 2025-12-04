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
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';

@Entity({ name: 'notes' })
export class NotesModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text' })
  text: string;

  // Связь с пользователем
  @ManyToOne(() => UserModel)
  @JoinColumn({ name: 'author_id' })
  author: UserModel;

  @Column({ name: 'author_id' })
  authorId: number;

  // Связь с ProductLogAndStrategy
  @ManyToOne(() => ProductLogAndStrategyModel, (product) => product.notes)
  @JoinColumn({ name: 'product_log_and_strategy_id' })
  productLogAndStrategy: ProductLogAndStrategyModel;

  @Column({ name: 'product_log_and_strategy_id' })
  productLogAndStrategyId: number;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<NotesModel> = {}) {
    Object.assign(this, params);
  }
}
