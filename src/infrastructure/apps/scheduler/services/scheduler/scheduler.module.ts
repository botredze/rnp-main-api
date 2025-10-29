import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduledTasksModule } from '../scheduledTasks/scheduledTasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledTasksService } from '../scheduledTasks/scheduledTasks.service';
import { CronModule } from '../cron/cron.module';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Module({
  imports: [ScheduledTasksModule, CronModule, TypeOrmModule.forFeature([SchedularTasksModel])],
  controllers: [],
  providers: [SchedulerService, ScheduledTasksService],
})
export class SchedulerModule {}
