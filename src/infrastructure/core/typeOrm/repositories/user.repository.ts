import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class UserRepository extends  TypeOrmRepository<UserModel>{
  constructor(
    @InjectRepository(UserModel)
    repository: Repository<UserModel>,
  ) {
    super(repository);
  }
}