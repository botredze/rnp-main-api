import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskExecutorFactory } from '@/infrastructure/apps/executor/facrory/factory';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms.model';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';
import { AdvertisingCostHistoryModel } from '@/infrastructure/core/typeOrm/models/advestingCostHistory.model';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { AdvertInfoRepository } from '@/infrastructure/core/typeOrm/repositories/advestingInfo.repository';
import { AdvestingDayStatisticRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayStatistic.repository';
import { AdvestingDayAppsRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayApps.repository';
import { AdvestingDayAppsNmsRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayAppsNms.repository';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { AdvestingCostHistoryRepository } from '@/infrastructure/core/typeOrm/repositories/advestingCostHistory.repository';
import { OrderRepository } from '@/infrastructure/core/typeOrm/repositories/order.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { SalesRepository } from '@/infrastructure/core/typeOrm/repositories/sales.repository';
import { StocksRepository } from '@/infrastructure/core/typeOrm/repositories/stocks.repository';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import { ProductMetricsRepository } from '@/infrastructure/core/typeOrm/repositories/productMetrics.repository';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';
import { StockCountOnSideRepository } from '@/infrastructure/core/typeOrm/repositories/stockCountOnSide.repository';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
      StockCountOnSideModel,
    ]),
  ],
  providers: [
    TaskExecutorFactory,
    OrganizationRepository,
    AdvertInfoRepository,
    AdvestingDayStatisticRepository,
    AdvestingDayAppsRepository,
    AdvestingDayAppsNmsRepository,
    ProductRepository,
    AdvestingCostHistoryRepository,
    OrderRepository,
    HistoryRepository,
    SalesRepository,
    StocksRepository,
    StockCountRepository,
    ProductMetricsRepository,
    StockCountOnSideRepository,

    {
      provide: 'QUEUE_SERVICE',
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [
              {
                hostname: configService.getOrThrow<string>('RABBITMQ_HOST'),
                port: configService.getOrThrow<number>('RABBITMQ_PORT'),
                username: configService.getOrThrow<string>('RABBITMQ_USERNAME'),
                password: configService.getOrThrow<string>('RABBITMQ_PASSWORD'),
                vhost: configService.getOrThrow<string>('RABBITMQ_VHOST'),
              },
            ],
            queue: configService.getOrThrow<string>('RABBITMQ_QUEUE_NAME'),
            queueOptions: {
              durable: true,
              autoDelete: false,
              exclusive: false,
              persistent: true,
            },
          },
        }),
      inject: [ConfigService],
    },
  ],
  exports: [TaskExecutorFactory],
})

// @ts-ignore
export class TaskExecutorModule {}
