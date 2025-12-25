import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as env from '@/infrastructure/core/config/env';
import { ExecutorModule } from './services/executor/executor.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QueueReaderController } from '@/infrastructure/apps/executor/queueReader/queueReader.controller';
import { QueueReaderService } from '@/infrastructure/apps/executor/queueReader/queueReader.service';
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
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';
import { SalePlanSettingsModel } from '@/infrastructure/core/typeOrm/models/salePlanSettings.model';
import { NotesModel } from '@/infrastructure/core/typeOrm/models/notes.model';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { FinanceReportReadyModel } from '@/infrastructure/core/typeOrm/models/financeReportReady.model';
import { ProductCostPriceModel } from '@/infrastructure/core/typeOrm/models/productCostPrice.model';
import { OtherExpensesModel } from '@/infrastructure/core/typeOrm/models/otherExpenses.model';
import { ExpensesArticlesModel } from '@/infrastructure/core/typeOrm/models/expensesArticles.model';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
    }),
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
            SalePlanSettingsModel,
            NotesModel,
            StockCountOnSideModel,
            FinanceReportsModel,
            FinanceReportReadyModel,
            ProductCostPriceModel,
            OtherExpensesModel,
            ExpensesArticlesModel,
          ],
          synchronize: false,
        };

        return options;
      },
      inject: [ConfigService],
    }),
    ExecutorModule,
  ],
  controllers: [QueueReaderController],
  providers: [QueueReaderService],
})
export class AppModule {}
