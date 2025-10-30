import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class AdvestingDayAppsRepository extends TypeOrmRepository<AdvertisingDayAppModel>{
  constructor(
    @InjectRepository(AdvertisingDayAppModel) repository: Repository<AdvertisingDayAppModel>,
  ) {
    super(repository);
  }
}