import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class FinanceReportsRepository extends TypeOrmRepository<FinanceReportsModel> {
  constructor(@InjectRepository(FinanceReportsModel) repository: Repository<FinanceReportsModel>) {
    super(repository);
  }
}
