import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { ProductCostPriceModel } from '@/infrastructure/core/typeOrm/models/productCostPrice.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class ProductCostPriceRepository extends TypeOrmRepository<ProductCostPriceModel> {
  constructor(@InjectRepository(ProductCostPriceModel) repository: Repository<ProductCostPriceModel>) {
    super(repository);
  }
}
