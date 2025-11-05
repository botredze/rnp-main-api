import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class StockCountRepository extends TypeOrmRepository<StockCountModel> {
  constructor(@InjectRepository(StockCountModel) repository: Repository<StockCountModel>) {
    super(repository);
  }
}
