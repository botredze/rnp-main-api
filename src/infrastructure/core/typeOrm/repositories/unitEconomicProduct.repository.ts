import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class UnitEconomicProductRepository extends TypeOrmRepository<UnitEconomicProductsModel> {
  constructor(@InjectRepository(UnitEconomicProductsModel) repository: Repository<UnitEconomicProductsModel>) {
    super(repository);
  }
}
