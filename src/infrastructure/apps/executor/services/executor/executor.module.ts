import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutorService } from '@/infrastructure/apps/executor/services/executor/executor.service';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { TaskExecutorModule } from '@/infrastructure/apps/executor/facrory/taskExecutor.module';

@Module({
  imports: [TypeOrmModule.forFeature([SchedularTasksModel]), TaskExecutorModule],
  controllers: [],
  providers: [ExecutorService],
  exports: [ExecutorService],
})
export class ExecutorModule {}
