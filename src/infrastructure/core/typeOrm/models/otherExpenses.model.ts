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
import { ExpensesArticlesModel } from '@/infrastructure/core/typeOrm/models/expensesArticles.model';

export enum OtherExpensesStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

@Entity({ name: 'other_expenses' })
export class OtherExpensesModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @ManyToOne(() => ExpensesArticlesModel, (article) => article.costPrices)
  @JoinColumn({ name: 'expense_article_id' })
  expenseArticle: ExpensesArticlesModel;

  @Column({ name: 'expense_article_id' })
  expenseArticleId: number;

  @Column({
    type: 'enum',
    enum: OtherExpensesStatus,
    default: OtherExpensesStatus.ACTIVE,
  })
  status: OtherExpensesStatus;

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

  constructor(params: Partial<OtherExpensesModel> = {}) {
    Object.assign(this, params);
  }
}
