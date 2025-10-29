import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';


export class OrganizationRepository extends TypeOrmRepository<OrganizationsModel>{
  constructor(
    @InjectRepository(OrganizationsModel)
    repository: Repository<OrganizationsModel>,
  ) {
    super(repository);
  }

}