import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_EMITTER_EVENTS, TaskName } from '@/infrastructure/apps/executor/config/config';

@Injectable()
export class QueueReaderService {
  private readonly logger = new Logger(QueueReaderService.name);

  constructor(private eventEmitter: EventEmitter2) {}

  emitEventToExecutor(taskName: TaskName) {
    this.eventEmitter.emit(EVENT_EMITTER_EVENTS.NEW_TASK, taskName);
  }
}
