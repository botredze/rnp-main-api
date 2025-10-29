import { Module, NestModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import path from 'node:path';
import * as env from '@/infrastructure/core/config/env';

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
        const dbDebug = configService.getOrThrow<env.Environment['DB_DEBUG']>('DB_DEBUG');

        const options: TypeOrmModuleOptions = {
          type: dbDriver,
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbDatabase,
          entities: [path.join(__dirname, '../../../../**/*.model.{ts,js}')],
          synchronize: false,
          logging: dbDebug,
        };

        return options;
      },
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot({}),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 300,
      },
    ]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {

}