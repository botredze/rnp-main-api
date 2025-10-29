import { Injectable, OnModuleInit } from '@nestjs/common';
import { ScheduledTasksService } from '../scheduledTasks/scheduledTasks.service';
import { CronService } from '../cron/cron.service';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private tasks: Array<SchedularTasksModel>;

  constructor(
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly cronService: CronService,
  ) {
    this.tasks = new Array<SchedularTasksModel>();
  }

  async onModuleInit() {
    await this.scheduleTasks();
  }

  async scheduleTasks() {
    this.tasks.map((task) => {
      this.cronService.stopCronJob(task.name);
      this.cronService.deleteCronJob(task.name);
    });

    this.tasks = await this.scheduledTasksService.getTasks();

    this.tasks.map((task) => {
      setTimeout(() => {
        this.cronService.addCronJob(task.name, task.scheduleRule);
      }, task.runAfter);
    });
  }
}
