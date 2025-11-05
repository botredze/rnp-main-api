import 'reflect-metadata';
import 'dotenv/config';
import type { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import type { SeederOptions } from 'typeorm-extension';
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

const options: DataSourceOptions & SeederOptions = {
  type: process.env.DB_DRIVER as 'mysql' | 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

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
  ],
  migrations: [process.cwd() + '/src/core/typeOrm/migrations/*.ts'],
  migrationsTableName: 'migrations',

  seeds: [process.cwd() + '/src/core/typeOrm/seeders/*.ts'],

  poolErrorHandler: (error) => {
    // TODO: Logger
    console.error(error);

    process.exit(1);
  },
};

export const AppDataSource = new DataSource(options);
