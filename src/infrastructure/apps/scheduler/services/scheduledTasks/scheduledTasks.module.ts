import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Module({
  imports: [TypeOrmModule.forFeature([SchedularTasksModel])],
  controllers: [],
  providers: [],
})
export class ScheduledTasksModule {}
