import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class SchedulerRepository extends TypeOrmRepository<SchedularTasksModel> {
  constructor(@InjectRepository(SchedularTasksModel) repository: Repository<SchedularTasksModel>) {
    super(repository);
  }
}
