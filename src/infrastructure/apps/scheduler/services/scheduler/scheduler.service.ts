import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ScheduledTasksService } from '../scheduledTasks/scheduledTasks.service';
import { CronService } from '../cron/cron.service';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private tasks: Array<SchedularTasksModel>;
  private reloadInterval: NodeJS.Timeout;

  constructor(
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly cronService: CronService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.tasks = new Array<SchedularTasksModel>();
  }

  async onModuleInit() {
    await this.scheduleTasks();

    // Перезагружать задачи каждый час
    this.reloadInterval = setInterval(async () => {
      console.log('Перезагрузка задач из БД...');
      await this.scheduleTasks();
    }, 60 * 60 * 1000); // 1 час
  }

  onModuleDestroy() {
    if (this.reloadInterval) {
      clearInterval(this.reloadInterval);
    }
  }

  @OnEvent('schedular.tasks.updated')
  async reloadTasks() {
    console.log('task create');
    await this.scheduleTasks();
  }

  async scheduleTasks() {
    // Удаляем ВСЕ зарегистрированные cron jobs
    const allJobs = this.schedulerRegistry.getCronJobs();
    allJobs.forEach((_, name) => {
      this.cronService.stopCronJob(name);
      this.cronService.deleteCronJob(name);
    });

    // Загружаем актуальные задачи из БД
    this.tasks = await this.scheduledTasksService.getTasks();

    // Создаем новые cron jobs
    this.tasks.forEach((task) => {
      setTimeout(() => {
        this.cronService.addCronJob(task.name, task.scheduleRule);
      }, task.runAfter);
    });
  }
}
