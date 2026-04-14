import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtherExpensesModel } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';
import { ExpensesArticlesModel } from '@/infrastructure/core/typeOrm/models/expensesArticles.model';
import { OtherExpensesRepository } from '@/infrastructure/core/typeOrm/repositories/otherExpenses.repository';
import { ExpensesArticlesRepository } from '@/infrastructure/core/typeOrm/repositories/expensesArticles.repository';
import { OtherExpensesController } from '@/infrastructure/apps/main/modules/otherExpenses/otherExpenses.controller';
import { OtherExpensesUseCase } from '@/useCase/controllers/otherExpenses/otherExpenses.useCase';

@Module({
  imports: [TypeOrmModule.forFeature([OtherExpensesModel, ExpensesArticlesModel])],
  controllers: [OtherExpensesController],
  providers: [
    OtherExpensesRepository,
    ExpensesArticlesRepository,
    {
      provide: OtherExpensesUseCase,
      useFactory: (
        expensesRepository: OtherExpensesRepository,
        articlesRepository: ExpensesArticlesRepository,
      ) => new OtherExpensesUseCase(expensesRepository, articlesRepository),
      inject: [OtherExpensesRepository, ExpensesArticlesRepository],
    },
  ],
})
export class OtherExpensesModule {}
