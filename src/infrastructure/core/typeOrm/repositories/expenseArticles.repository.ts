import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { ExpensesArticlesModel } from '@/infrastructure/core/typeOrm/models/expensesArticles.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ExpenseArticlesRepository extends TypeOrmRepository<ExpensesArticlesModel> {
  constructor(@InjectRepository(ExpensesArticlesModel) repository: Repository<ExpensesArticlesModel>) {
    super(repository);
  }
}
