import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject('QUEUE_SERVICE') private readonly client: ClientProxy) {}

  async sendMessage(pattern: string, message: any) {
    try {
      await this.client.emit(pattern, message).toPromise();
      this.logger.log('Сообщение успешно отправлено:', message, `Шаблон: ${pattern}`);
    } catch (error) {
      this.logger.error('Ошибка при отправке сообщения:', error);
    }
  }
}
