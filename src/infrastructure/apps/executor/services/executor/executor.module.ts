import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutorService } from '@/infrastructure/apps/executor/services/executor/executor.service';
import { TaskExecutorModule } from '@/infrastructure/apps/executor/facrory/taskExecutor.service';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Module({
  imports: [TypeOrmModule.forFeature([SchedularTasksModel]), TaskExecutorModule],
  controllers: [],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}