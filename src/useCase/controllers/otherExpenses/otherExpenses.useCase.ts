import { OtherExpensesRepository } from '@/infrastructure/core/typeOrm/repositories/otherExpenses.repository';
import { ExpensesArticlesRepository } from '@/infrastructure/core/typeOrm/repositories/expensesArticles.repository';
import {
  CreateArticleDto,
  CreateExpenseDto,
  GetExpensesDto,
  UpdateExpenseDto,
} from '@/shared/dtos/otherExpenses.dto';
import { OtherExpensesStatus } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';
import { ExpensesArticlesStatus } from '@/infrastructure/core/typeOrm/models/expensesArticles.model';
import { Between, ILike } from 'typeorm';

export class OtherExpensesUseCase {
  readonly #expensesRepository: OtherExpensesRepository;
  readonly #articlesRepository: ExpensesArticlesRepository;

  constructor(
    expensesRepository: OtherExpensesRepository,
    articlesRepository: ExpensesArticlesRepository,
  ) {
    this.#expensesRepository = expensesRepository;
    this.#articlesRepository = articlesRepository;
  }

  async getExpenses(query: GetExpensesDto) {
    const { organizationId, startDate, endDate, articleId, operationType, page = 1, limit = 50 } = query;

    const where: any = {
      organizationId,
      status: OtherExpensesStatus.ACTIVE,
    };

    if (startDate && endDate) {
      where.date = Between(new Date(startDate), new Date(endDate));
    }

    if (articleId) {
      where.expenseArticleId = articleId;
    }

    if (operationType) {
      where.operationType = operationType;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.#expensesRepository['repository'].findAndCount({
      where,
      relations: ['expenseArticle'],
      order: { date: 'DESC' },
      skip,
      take: limit,
    });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      data: items.map((e) => this.#mapExpense(e)),
      total,
      totalPages: Math.ceil(total / limit),
      totalAmount: Math.round(totalAmount),
    };
  }

  async createExpense(dto: CreateExpenseDto) {
    const expense = await this.#expensesRepository.create({
      organizationId: dto.organizationId,
      date: dto.date as any,
      description: dto.description,
      amount: dto.amount,
      expenseArticleId: dto.expenseArticleId,
      operationType: dto.operationType,
      distributionMethod: dto.distributionMethod,
      distributeBy: dto.distributeBy,
      frequency: dto.frequency,
      startPeriod: dto.startPeriod as any,
      endPeriod: dto.endPeriod as any,
      isOfficial: dto.isOfficial ?? false,
      status: OtherExpensesStatus.ACTIVE,
    });

    const full = await this.#expensesRepository.findOne({
      where: { id: expense.id },
      relations: ['expenseArticle'],
    });

    return this.#mapExpense(full);
  }

  async updateExpense(id: number, dto: UpdateExpenseDto) {
    await this.#expensesRepository.updateById(id, dto as any);

    const updated = await this.#expensesRepository.findOne({
      where: { id },
      relations: ['expenseArticle'],
    });

    return this.#mapExpense(updated);
  }

  async deleteExpense(id: number) {
    await this.#expensesRepository.updateById(id, { status: OtherExpensesStatus.DELETED } as any);
    return { success: true };
  }

  async getArticles(organizationId: number) {
    const articles = await this.#articlesRepository.findMany({
      where: { organizationId, status: ExpensesArticlesStatus.ACTIVE },
      order: { name: 'ASC' } as any,
    });

    return articles.map((a) => ({
      id: a.id,
      name: a.name,
      organizationId: a.organizationId,
      createdAt: a.createdAt,
    }));
  }

  async createArticle(dto: CreateArticleDto) {
    const article = await this.#articlesRepository.create({
      organizationId: dto.organizationId,
      name: dto.name,
      status: ExpensesArticlesStatus.ACTIVE,
    });

    return {
      id: article.id,
      name: article.name,
      organizationId: article.organizationId,
      createdAt: article.createdAt,
    };
  }

  async deleteArticle(id: number) {
    await this.#articlesRepository.updateById(id, { status: ExpensesArticlesStatus.DELETED } as any);
    return { success: true };
  }

  #mapExpense(e: any) {
    return {
      id: e.id,
      organizationId: e.organizationId,
      date: e.date,
      description: e.description,
      amount: Number(e.amount),
      expenseArticleId: e.expenseArticleId,
      articleName: e.expenseArticle?.name ?? null,
      operationType: e.operationType,
      distributionMethod: e.distributionMethod,
      distributeBy: e.distributeBy,
      frequency: e.frequency,
      startPeriod: e.startPeriod,
      endPeriod: e.endPeriod,
      isOfficial: e.isOfficial,
      createdAt: e.createdAt,
    };
  }
}
