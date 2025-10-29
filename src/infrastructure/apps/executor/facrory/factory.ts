import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TaskName } from '@/infrastructure/apps/executor/config/config';
import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';

@Injectable()
export class TaskExecutorFactory {
  constructor(
    private readonly queueServiceLegacy: ClientProxy,
  ) {}

  create(taskName: TaskName): TaskExecutor {
    switch (taskName) {
      // case 'image-service-images-drop-executor':
      //   return new ImageServiceImagesDropExecutor(this.imageService, this.imageServiceImagesRepository);
      default:
        throw new Error(`No executor found for task: ${taskName}`);
    }
  }
}
