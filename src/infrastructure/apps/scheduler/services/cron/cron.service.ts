import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { QueueName } from '../../../../services/queue/const';
import { QueueService } from '../../../../services/queue/queue.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private queueService: QueueService,
  ) {}

  addCronJob(name: string, cronTime: string) {
    const job = new CronJob(
      cronTime,
      async () => {
        await this.queueService.sendMessage(QueueName.tasks, name);

        this.logger.warn(`Запущен ${name}`);
      },
      null,
      false,
      null,
      null,
      true,
    );

    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    this.logger.warn(`Job ${name} добавлен с расписанием ${cronTime}`);
  }

  stopCronJob(name: string) {
    try {
      const job = this.schedulerRegistry.getCronJob(name);
      if (job) {
        job.stop();
        this.logger.warn(`Job ${name} остановлен`);
      }
    } catch (error) {
      this.logger.warn(`Job ${name} не найден`);
    }
  }

  deleteCronJob(name: string) {
    try {
      this.schedulerRegistry.deleteCronJob(name);
      this.logger.warn(`Job ${name} удален`);
    } catch (error) {
      this.logger.warn(`Job ${name} не найден для удаления`);
    }
  }

  async executeNow(name: string) {
    await this.queueService.sendMessage(QueueName.tasks, name);
    this.logger.warn(`Job ${name} запущен немедленно`);
  }
}
