import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class SalesRepository extends  TypeOrmRepository<SalesModel>{
  constructor(@InjectRepository(SalesModel) repository: Repository<SalesModel>) {
    super(repository);
  }
}