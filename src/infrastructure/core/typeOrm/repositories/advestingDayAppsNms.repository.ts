import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class AdvestingDayAppsNmsRepository extends TypeOrmRepository<AdvertisingDayAppNmModel>{
  constructor(
    @InjectRepository(AdvertisingDayAppNmModel) repository: Repository<AdvertisingDayAppNmModel>,
  ) {
    super(repository);
  }
}