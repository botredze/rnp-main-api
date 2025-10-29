import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QueueService } from './queue.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

export interface QueueModuleOptions {
  queue: string;
}

@Module({})
export class QueueModule {
  static forRoot(options: QueueModuleOptions): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync([
          {
            name: 'QUEUE_SERVICE',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('AMQP_URL') || 'amqp://localhost:5672'],
                queue: options.queue,
                queueOptions: {
                  durable: true,
                },
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      providers: [QueueService],
      exports: [QueueService],
    };
  }
}
