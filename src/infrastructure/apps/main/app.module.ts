import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import * as env from '@/infrastructure/core/config/env';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';
import { AdvertisingCostHistoryModel } from '@/infrastructure/core/typeOrm/models/advestingCostHistory.model';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms.model';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';
import { UnitEconomicModule } from '@/infrastructure/apps/main/modules/unitEconomic/unit-economic.module';
import { AuthMiddleware } from '@/infrastructure/apps/main/middleware/auth.middleware';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { AuthModule } from '@/infrastructure/apps/main/modules/auth/auth.module';
import { OrganizationModule } from '@/infrastructure/apps/main/modules/organization/organization.module';
import { JwtService } from '@/infrastructure/services/jwtService/jwt.service';
import { RnpStatisticModule } from '@/infrastructure/apps/main/modules/rnp-statistic/rnp-statistic.module';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: env.validate,
    }),

    TypeOrmModule.forFeature([UserModel]),

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
          entities: [
            UserModel,
            OrganizationsModel,
            ProductsModel,
            OrderModel,
            SalesModel,
            HistoryModel,
            StockCountModel,
            StocksModel,
            AdvertisingDayAppNmModel,
            AdvertisingDayStatisticModel,
            AdvertisingModel,
            AdvertisingDayAppModel,
            AdvertisingCostHistoryModel,
            UnitEconomicProductsModel,
            UnitEconomicProductMetricsModel,
            SchedularTasksModel,
            ProductLogAndStrategyModel,
          ],
          synchronize: true,
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

    UnitEconomicModule,
    AuthModule,
    OrganizationModule,
    RnpStatisticModule,
  ],
  controllers: [],
  providers: [
    UserRepository,
    JwtService,
    {
      provide: AuthMiddleware,
      useFactory: (userRepository: UserRepository, jwtService: JwtService) =>
        new AuthMiddleware(userRepository, jwtService),
      inject: [UserRepository, JwtService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude('api/auth/login', 'api/auth/register').forRoutes('*');
  }
}
