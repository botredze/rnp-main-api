import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { OtherExpensesUseCase } from '@/useCase/controllers/otherExpenses/otherExpenses.useCase';
import {
  CreateArticleDto,
  CreateExpenseDto,
  GetExpensesDto,
  UpdateExpenseDto,
} from '@/shared/dtos/otherExpenses.dto';

@Controller('other-expenses')
export class OtherExpensesController {
  readonly #useCase: OtherExpensesUseCase;

  constructor(useCase: OtherExpensesUseCase) {
    this.#useCase = useCase;
  }

  @Get()
  async getExpenses(@Query() query: GetExpensesDto) {
    return await this.#useCase.getExpenses({
      ...query,
      organizationId: Number(query.organizationId),
      articleId: query.articleId ? Number(query.articleId) : undefined,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 50,
    });
  }

  @Post()
  async createExpense(@Body() body: CreateExpenseDto) {
    return await this.#useCase.createExpense({
      ...body,
      organizationId: Number(body.organizationId),
      amount: Number(body.amount),
    });
  }

  @Put(':id')
  async updateExpense(@Param('id') id: string, @Body() body: UpdateExpenseDto) {
    return await this.#useCase.updateExpense(Number(id), body);
  }

  @Delete(':id')
  async deleteExpense(@Param('id') id: string) {
    return await this.#useCase.deleteExpense(Number(id));
  }

  @Get('articles')
  async getArticles(@Query('organizationId') organizationId: string) {
    return await this.#useCase.getArticles(Number(organizationId));
  }

  @Post('articles')
  async createArticle(@Body() body: CreateArticleDto) {
    return await this.#useCase.createArticle({
      ...body,
      organizationId: Number(body.organizationId),
    });
  }

  @Delete('articles/:id')
  async deleteArticle(@Param('id') id: string) {
    return await this.#useCase.deleteArticle(Number(id));
  }
}
