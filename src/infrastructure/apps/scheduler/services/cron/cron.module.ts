import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { QueueModule } from '../../../../services/queue/queue.module';
import { QueueName } from '../../../../services/queue/const';

@Module({
  imports: [QueueModule.forRoot({ queue: QueueName.tasks }), ScheduleModule.forRoot()],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
