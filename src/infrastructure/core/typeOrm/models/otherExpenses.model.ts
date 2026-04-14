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

export enum ExpenseOperationType {
  ONE_TIME = 'one_time',
  PLANNED = 'planned',
}

export enum ExpenseDistributionMethod {
  PROPORTIONAL = 'proportional',
  EQUAL = 'equal',
}

export enum ExpenseDistributeBy {
  SHOPS = 'shops',
  ARTICLES = 'articles',
  BRANDS = 'brands',
}

export enum ExpenseFrequency {
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

@Entity({ name: 'other_expenses' })
export class OtherExpensesModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id?: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @ManyToOne(() => ExpensesArticlesModel, (article) => article.expenses, { nullable: true })
  @JoinColumn({ name: 'expense_article_id' })
  expenseArticle: ExpensesArticlesModel;

  @Column({ name: 'expense_article_id', nullable: true })
  expenseArticleId: number;

  @Column({
    type: 'enum',
    enum: ExpenseOperationType,
    default: ExpenseOperationType.ONE_TIME,
    name: 'operation_type',
  })
  operationType: ExpenseOperationType;

  @Column({
    type: 'enum',
    enum: ExpenseDistributionMethod,
    default: ExpenseDistributionMethod.PROPORTIONAL,
    name: 'distribution_method',
  })
  distributionMethod: ExpenseDistributionMethod;

  @Column({
    type: 'enum',
    enum: ExpenseDistributeBy,
    default: ExpenseDistributeBy.SHOPS,
    name: 'distribute_by',
  })
  distributeBy: ExpenseDistributeBy;

  @Column({
    type: 'enum',
    enum: ExpenseFrequency,
    nullable: true,
    name: 'frequency',
  })
  frequency: ExpenseFrequency;

  @Column({ type: 'date', nullable: true, name: 'start_period' })
  startPeriod: Date;

  @Column({ type: 'date', nullable: true, name: 'end_period' })
  endPeriod: Date;

  @Column({ type: 'boolean', default: false, name: 'is_official' })
  isOfficial: boolean;

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
