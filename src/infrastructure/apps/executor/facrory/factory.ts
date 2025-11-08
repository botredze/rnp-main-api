import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { TaskName } from '@/infrastructure/apps/executor/config/config';
import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';

// repositories
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
import { WbControllerExecutor } from '@/infrastructure/apps/executor/executors/wbApiExecutors/wbController.executor';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import { MetricsExecutor } from '@/infrastructure/apps/executor/executors/productMetrics/metrics.executor';
import { ProductMetricsRepository } from '@/infrastructure/core/typeOrm/repositories/productMetrics.repository';
import { GetStockCountTodayExecutor } from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getStockCountToday.executor';

@Injectable()
export class TaskExecutorFactory {
  constructor(
    @Inject('QUEUE_SERVICE')
    private readonly queueServiceLegacy: ClientProxy,
    private readonly configService: ConfigService,
    private readonly organizationRepository: OrganizationRepository,
    private readonly advertInfoRepository: AdvertInfoRepository,
    private readonly advertDayStatisticRepository: AdvestingDayStatisticRepository,
    private readonly advertDayAppsRepository: AdvestingDayAppsRepository,
    private readonly advertDayAppsNmsRepository: AdvestingDayAppsNmsRepository,
    private readonly productRepository: ProductRepository,
    private readonly advertingCostHistoryRepository: AdvestingCostHistoryRepository,
    private readonly orderRepository: OrderRepository,
    private readonly productStatsRepository: HistoryRepository,
    private readonly salesRepository: SalesRepository,
    private readonly stockRepository: StocksRepository,
    private readonly stockCountRepository: StockCountRepository,
    private readonly productMetricsRepository: ProductMetricsRepository,
  ) {}

  create(taskName: TaskName): TaskExecutor {
    console.log(taskName, 'taskName');
    switch (taskName) {
      case TaskName.OrganizationInitExecutor:
        return new WbControllerExecutor(
          this.organizationRepository,
          this.advertInfoRepository,
          this.advertDayStatisticRepository,
          this.advertDayAppsRepository,
          this.advertDayAppsNmsRepository,
          this.productRepository,
          this.advertingCostHistoryRepository,
          this.orderRepository,
          this.productStatsRepository,
          this.salesRepository,
          this.stockRepository,
          this.configService,
          this.stockCountRepository,
        );

      case TaskName.CreateProductLogs:
        return new MetricsExecutor(this.productRepository, this.productMetricsRepository);

      case TaskName.GetStockCount:
        return new GetStockCountTodayExecutor(
          this.stockCountRepository,
          this.productRepository,
          this.organizationRepository,
        );
      default:
        throw new Error(`No executor found for task: ${taskName}`);
    }
  }
}
