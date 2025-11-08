import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ProductMetricsRepository extends TypeOrmRepository<ProductLogAndStrategyModel> {
  constructor(@InjectRepository(ProductLogAndStrategyModel) repository: Repository<ProductLogAndStrategyModel>) {
    super(repository);
  }
}
