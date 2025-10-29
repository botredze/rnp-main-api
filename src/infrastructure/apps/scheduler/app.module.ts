import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as env from '@/infrastructure/core/config/env';
import { SchedulerModule } from './services/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: env.validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<env.Environment>) => {
        const dbDriver = configService.getOrThrow<env.Environment['DB_DRIVER']>('DB_DRIVER');
        const dbHost = configService.getOrThrow<env.Environment['DB_HOST']>('DB_HOST');
        const dbPort = configService.getOrThrow<env.Environment['DB_PORT']>('DB_PORT');
        const dbUsername = configService.getOrThrow<env.Environment['DB_USERNAME']>('DB_USERNAME');
        const dbPassword = configService.getOrThrow<env.Environment['DB_PASSWORD']>('DB_PASSWORD');
        const dbDatabase = configService.getOrThrow<env.Environment['DB_DATABASE']>('DB_DATABASE');

        const options = {
          type: dbDriver,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [path.join(__dirname, '../../../../**/*.model.{ts,js}')],
          synchronize: false,
        };

        return options;
      },
      inject: [ConfigService],
    }),
    SchedulerModule,
  ],
  providers: [],
})
export class AppModule {}
