import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class ProductRepository extends TypeOrmRepository<ProductsModel> {
  constructor(
    @InjectRepository(ProductsModel) repository: Repository<ProductsModel>,
  ) {
    super(repository);
  }
}