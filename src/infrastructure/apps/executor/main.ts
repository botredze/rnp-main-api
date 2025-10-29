import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { ExecutorService } from './services/executor/executor.service';
import { QueueName } from '@/infrastructure/services/queue/const';
import { TaskName } from '@/infrastructure/apps/executor/config/config';

async function bootstrap() {
  const taskArg = process.argv.find((arg) => arg.startsWith('--task='));

  if (taskArg) {
    const taskName = taskArg.split('=')[1] as TaskName;

    const appContext = await NestFactory.createApplicationContext(AppModule);

    const executorService = appContext.get(ExecutorService);

    await executorService.onTaskCreated(taskName);

    await appContext.close();
    process.exit(0);
  } else {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.RMQ,
      options: {
        urls: [new ConfigService().get<string>('AMQP_URL')],
        queue: QueueName.tasks,
        queueOptions: {
          durable: true,
        },
      },
    });

    await app.listen();
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
