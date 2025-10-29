import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EVENT_EMITTER_EVENTS, TASK_STATUS, TaskName } from '@/infrastructure/apps/executor/config/config';
import { TaskExecutorFactory } from '@/infrastructure/apps/executor/facrory/factory';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Injectable()
export class ExecutorService {
  private logger = new Logger(ExecutorService.name);

  constructor(
    @InjectRepository(SchedularTasksModel)
    private readonly repository: Repository<SchedularTasksModel>,
    private readonly taskExecutorFactory: TaskExecutorFactory,
  ) {}

  @OnEvent(EVENT_EMITTER_EVENTS.NEW_TASK)
  async onTaskCreated(taskName: TaskName) {
    const executor = this.taskExecutorFactory.create(taskName);

    try {
      await executor.execute();

      await this.updateTask(taskName, TASK_STATUS.SUCCESS);
    } catch (err) {
      this.logger.error(err);

      await this.updateTask(taskName, TASK_STATUS.ERROR);
    }
  }

  async updateTask(taskName: TaskName, status: string) {
    await this.repository.update(
      {
        name: taskName,
      },
      {
        status: status,
        lastRunTime: new Date(),
      },
    );
  }
}
