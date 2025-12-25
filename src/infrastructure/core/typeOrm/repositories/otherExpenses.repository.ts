import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { OtherExpensesModel } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class OtherExpensesRepository extends TypeOrmRepository<OtherExpensesModel> {
  constructor(@InjectRepository(OtherExpensesModel) repository: Repository<OtherExpensesModel>) {
    super(repository);
  }
}
