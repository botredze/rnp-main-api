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
  private pollInterval: NodeJS.Timeout;

  constructor(
    private readonly scheduledTasksService: ScheduledTasksService,
    private readonly cronService: CronService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.tasks = new Array<SchedularTasksModel>();
  }

  async onModuleInit() {
    await this.scheduleTasks();

    // Перезагружать cron jobs каждый час
    this.reloadInterval = setInterval(async () => {
      console.log('Перезагрузка задач из БД...');
      await this.scheduleTasks();
    }, 60 * 60 * 1000); // 1 час

    // Проверять новые незапущенные задачи каждую минуту
    this.pollInterval = setInterval(async () => {
      await this.executeNewTasks();
    }, 60 * 1000); // 1 минута
  }

  onModuleDestroy() {
    if (this.reloadInterval) {
      clearInterval(this.reloadInterval);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private async executeNewTasks() {
    const tasks = await this.scheduledTasksService.getTasks();
    for (const task of tasks) {
      if (!task.lastRunTime && task.status !== 'running') {
        await this.cronService.executeNow(task.name);
      }
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

      // Если задача ни разу не запускалась и не в процессе — выполняем немедленно
      if (!task.lastRunTime && task.status !== 'running') {
        this.cronService.executeNow(task.name);
      }
    });
  }
}
