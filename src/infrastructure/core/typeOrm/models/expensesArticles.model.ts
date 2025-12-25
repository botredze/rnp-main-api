import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OtherExpensesModel } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';

export enum ExpensesArticlesStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

@Entity({ name: 'expenses_articles' })
export class ExpensesArticlesModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ExpensesArticlesStatus,
    default: ExpensesArticlesStatus.ACTIVE,
  })
  status: ExpensesArticlesStatus;

  @OneToMany(() => OtherExpensesModel, (otherExpenses) => otherExpenses.expenseArticle)
  costPrices: Array<OtherExpensesModel>;

  @Column({ type: 'date' })
  date: Date;

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

  constructor(params: Partial<ExpensesArticlesModel> = {}) {
    Object.assign(this, params);
  }
}
