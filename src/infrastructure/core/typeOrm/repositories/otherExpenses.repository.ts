import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { OtherExpensesModel, OtherExpensesStatus } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class OtherExpensesRepository extends TypeOrmRepository<OtherExpensesModel> {
  constructor(@InjectRepository(OtherExpensesModel) repository: Repository<OtherExpensesModel>) {
    super(repository);
  }

  async getTotalForPeriod(organizationId: number, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .where('e.organizationId = :organizationId', { organizationId })
      .andWhere('e.status = :status', { status: OtherExpensesStatus.ACTIVE })
      .andWhere('e.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();
    return Number(result.total);
  }
}
