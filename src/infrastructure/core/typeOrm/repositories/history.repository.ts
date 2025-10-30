import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class HistoryRepository extends TypeOrmRepository<HistoryModel> {
  constructor(@InjectRepository(HistoryModel) repository: Repository<HistoryModel>) {
    super(repository);
  }
}