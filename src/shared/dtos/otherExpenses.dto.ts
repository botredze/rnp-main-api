import {
  ExpenseDistributeBy,
  ExpenseDistributionMethod,
  ExpenseFrequency,
  ExpenseOperationType,
} from '@/infrastructure/core/typeOrm/models/otherExpenses.model';

export class CreateExpenseDto {
  organizationId: number;
  date: string;
  description?: string;
  amount: number;
  expenseArticleId?: number;
  operationType: ExpenseOperationType;
  distributionMethod: ExpenseDistributionMethod;
  distributeBy: ExpenseDistributeBy;
  frequency?: ExpenseFrequency;
  startPeriod?: string;
  endPeriod?: string;
  isOfficial?: boolean;
}

export class UpdateExpenseDto {
  date?: string;
  description?: string;
  amount?: number;
  expenseArticleId?: number;
  operationType?: ExpenseOperationType;
  distributionMethod?: ExpenseDistributionMethod;
  distributeBy?: ExpenseDistributeBy;
  frequency?: ExpenseFrequency;
  startPeriod?: string;
  endPeriod?: string;
  isOfficial?: boolean;
}

export class GetExpensesDto {
  organizationId: number;
  startDate?: string;
  endDate?: string;
  articleId?: number;
  operationType?: ExpenseOperationType;
  page?: number;
  limit?: number;
}

export class CreateArticleDto {
  organizationId: number;
  name: string;
}
