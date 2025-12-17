import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class StockCountOnSideRepository extends TypeOrmRepository<StockCountOnSideModel> {
  constructor(@InjectRepository(StockCountOnSideModel) repository: Repository<StockCountOnSideModel>) {
    super(repository);
  }
}
