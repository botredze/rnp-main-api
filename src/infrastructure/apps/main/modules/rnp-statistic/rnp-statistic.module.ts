import { Module } from '@nestjs/common';
import { RnpStatisticController } from '@/infrastructure/apps/main/modules/rnp-statistic/rnp-statistic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { RnpUseCase } from '@/useCase/controllers/rnp/rnp.useCase';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { SalesRepository } from '@/infrastructure/core/typeOrm/repositories/sales.repository';
import { OrderRepository } from '@/infrastructure/core/typeOrm/repositories/order.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import { AdvestingDayStatisticRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayStatistic.repository';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductsModel,
      SalesModel,
      OrderModel,
      HistoryModel,
      StockCountModel,
      StocksModel,
      AdvertisingModel,
      AdvertisingDayStatisticModel,
      AdvertisingDayAppModel,
      AdvertisingDayAppNmModel,
    ]),
  ],
  controllers: [RnpStatisticController],
  providers: [
    ProductRepository,
    SalesRepository,
    OrderRepository,
    HistoryRepository,
    StockCountRepository,
    AdvestingDayStatisticRepository,
    {
      provide: RnpUseCase,
      useFactory: (
        productRepository: ProductRepository,
        salesRepository: SalesRepository,
        orderRepository: OrderRepository,
        historyRepository: HistoryRepository,
        stockCountRepository: StockCountRepository,
        advestingDayStatisticRepository: AdvestingDayStatisticRepository,
      ) =>
        new RnpUseCase(
          productRepository,
          salesRepository,
          orderRepository,
          historyRepository,
          stockCountRepository,
          advestingDayStatisticRepository,
        ),
      inject: [
        ProductRepository,
        SalesRepository,
        OrderRepository,
        HistoryRepository,
        StockCountRepository,
        AdvestingDayStatisticRepository,
      ],
    },
  ],
})
export class RnpStatisticModule {}
