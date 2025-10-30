import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AdvestingDayStatisticRepository extends TypeOrmRepository<AdvertisingDayStatisticModel>{
  constructor(
    @InjectRepository(AdvertisingDayStatisticModel) repository: Repository<AdvertisingDayStatisticModel>,
  ) {
    super(repository);
  }
}