import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class StocksRepository extends TypeOrmRepository<StocksModel> {
  constructor(
    @InjectRepository(StocksModel) repository: Repository<StocksModel>
  ) {
    super(repository);
  }
}