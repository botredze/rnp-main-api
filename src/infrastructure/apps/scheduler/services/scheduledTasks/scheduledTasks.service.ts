
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EventSubscriber } from 'typeorm';
import { isValidCron } from 'cron-validator';
import parser from 'cron-parser';
import { defaultScheduledTasks } from '../../config/config';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Injectable()
@EventSubscriber()
export class ScheduledTasksService implements OnModuleInit {
  private logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectRepository(SchedularTasksModel)
    private readonly repository: Repository<SchedularTasksModel>,
  ) {}

  async onModuleInit() {
    const promises = defaultScheduledTasks.map(async (task) => {
      const { name, scheduleRule } = task;

      const scheduledTask = await this.repository.findOne({
        where: {
          name,
        },
      });

      if (scheduledTask) {
        scheduledTask.scheduleRule = scheduleRule;

        await this.repository.save(scheduledTask);
      } else {
        const scheduledTask = new SchedularTasksModel({
          name,
          scheduleRule,
          status: 'created',
        });

        await this.repository.save(scheduledTask);
      }
    });

    await Promise.all(promises);
  }

  async getTasks(): Promise<Array<SchedularTasksModel>> {
    const tasks = await this.repository.find();

    const options = { seconds: true };

    const filtered = tasks.filter((task) => {
      return isValidCron(task.scheduleRule, options);
    });

    // TODO сделать изменение статуса в базе
    for (const invalidTask of tasks.filter((task) => {
      return !isValidCron(task.scheduleRule, options);
    })) {
      this.logger.error(
        `Error during running task with id=${invalidTask.id}, name=${invalidTask.name}, invalid cron ${invalidTask.scheduleRule}`,
      );
    }

    return filtered.map((task) => {
      return {
        ...task,
        runAfter: this.getRunAfter(task.lastRunTime, task.scheduleRule),
        // runAfter: this.getRunAfter(new Date(new Date().getTime() - 3000), task.scheduleRule),
      };
    });
  }

  private getRunAfter(lastRunTime: Date, cronExpression: string): number {
    if (!lastRunTime) {
      return 0;
    }

    const options = {
      currentDate: lastRunTime || new Date(),
    };

    const interval = parser.parse(cronExpression, options);
    const nextRun = interval.next().toDate();
    const diff = nextRun.getTime() - new Date().getTime();

    return diff > 0 ? diff : 0;
  }
}
