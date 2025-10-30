import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class OrderRepository extends TypeOrmRepository<OrderModel>{
  constructor(@InjectRepository(OrderModel) repository: Repository<OrderModel>) {
    super(repository);
  }
}