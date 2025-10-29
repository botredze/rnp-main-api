import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskExecutorFactory } from '@/infrastructure/apps/executor/facrory/factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
    ]),
  ],
  providers: [
    TaskExecutorFactory,
  ],
  exports: [TaskExecutorFactory],
})
export class TaskExecutorModule {}
