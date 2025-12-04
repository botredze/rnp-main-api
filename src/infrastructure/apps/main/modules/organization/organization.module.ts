import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { OrganizationUseCase } from '@/useCase/controllers/organization/organization.useCase';
import { OrganizationController } from '@/infrastructure/apps/main/modules/organization/organization.controller';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { SchedulerRepository } from '@/infrastructure/core/typeOrm/repositories/scheduler.repository';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationsModel, UserModel, SchedularTasksModel])],
  controllers: [OrganizationController],
  providers: [
    OrganizationRepository,
    UserRepository,
    SchedulerRepository,
    {
      provide: OrganizationUseCase,
      useFactory: (
        organizationRepository: OrganizationRepository,
        userRepository: UserRepository,
        schedularRepository: SchedulerRepository,
        eventEmitter: EventEmitter2,
      ) => new OrganizationUseCase(organizationRepository, userRepository, schedularRepository, eventEmitter),
      inject: [OrganizationRepository, UserRepository, SchedulerRepository, EventEmitter2],
    },
  ],
})
export class OrganizationModule {}
