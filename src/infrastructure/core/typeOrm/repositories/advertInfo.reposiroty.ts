import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AdvertInfoRepository extends TypeOrmRepository<AdvertisingModel>{
  constructor(@InjectRepository(AdvertisingModel) repository: Repository<AdvertisingModel>) {
    super(repository);
  }
}