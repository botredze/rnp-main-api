import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingCostHistoryModel } from '@/infrastructure/core/typeOrm/models/advestingCostHistory.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AdvestingCostHistoryRepository extends TypeOrmRepository<AdvertisingCostHistoryModel>{
  constructor(
    @InjectRepository(AdvertisingCostHistoryModel) repository: Repository<AdvertisingCostHistoryModel>,
  ) {
    super(repository);
  }
}