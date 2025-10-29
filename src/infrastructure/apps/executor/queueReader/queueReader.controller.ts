import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { QueueName } from '@/infrastructure/services/queue/const';
import { TaskName } from '@/infrastructure/apps/executor/config/config';
import { QueueReaderService } from '@/infrastructure/apps/executor/queueReader/queueReader.service';

@Controller()
export class QueueReaderController {
  constructor(private readonly queueReaderService: QueueReaderService) {}

  @EventPattern(QueueName.tasks)
  handleOrderPlaced(@Payload() taskName: TaskName) {
    this.queueReaderService.emitEventToExecutor(taskName);
  }
}
