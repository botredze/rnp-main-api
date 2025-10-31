import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { OrganizationStatuses } from '@/infrastructure/core/typeOrm/models/organizations.model';
import {
  GetProductsExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getProducts.executor';
import { GetStocksExecutor } from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getStocks.executor';
import { GetSalesExecutor } from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getSales.executor';
import {
  GetAdvertingPaymentHistoryExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getAdvertingPaymentHistory.executor';
import {
  GetStockReportExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getStockReport.executor';
import {
  GetOrganizationInfoExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getOrganizationInfo.executor';
import {
  GetAdvertingListExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getAdvertingList.executor';
import {
  GetAdvertingHistoryExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getAdvertingHistory.executor';
import { GetOrdersExecutor } from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getOrders.executor';
import {
  GetProductStatisticExecutor
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/services/getProductStatistic.executor';
import { AdvertInfoRepository } from '@/infrastructure/core/typeOrm/repositories/advestingInfo.repository';
import {
  AdvestingDayStatisticRepository
} from '@/infrastructure/core/typeOrm/repositories/advestingDayStatistic.repository';
import { AdvestingDayAppsRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayApps.repository';
import {
  AdvestingDayAppsNmsRepository
} from '@/infrastructure/core/typeOrm/repositories/advestingDayAppsNms.repository';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import {
  AdvestingCostHistoryRepository
} from '@/infrastructure/core/typeOrm/repositories/advestingCostHistory.repository';
import { OrderRepository } from '@/infrastructure/core/typeOrm/repositories/order.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { SalesRepository } from '@/infrastructure/core/typeOrm/repositories/sales.repository';
import { StocksRepository } from '@/infrastructure/core/typeOrm/repositories/stocks.repository';
import { ConfigService } from '@nestjs/config';

export class WbControllerExecutor extends TaskExecutor {
  readonly #configService: ConfigService;
  readonly #organizationRepository: OrganizationRepository;
  readonly #advertInfoRepository: AdvertInfoRepository;
  readonly #advertDayStatisticRepository: AdvestingDayStatisticRepository;
  readonly #advertDayAppsRepository: AdvestingDayAppsRepository;
  readonly #advertDayAppsNmsRepository: AdvestingDayAppsNmsRepository;
  readonly #productRepository: ProductRepository;
  readonly #advertingCostHistoryRepository: AdvestingCostHistoryRepository;
  readonly #orderRepository: OrderRepository;
  readonly #productStatsRepository: HistoryRepository;
  readonly #salesRepository: SalesRepository;
  readonly #stockRepository: StocksRepository;

  // executors
  readonly #getOrganizationInfoExecutor: GetOrganizationInfoExecutor;
  readonly #getProductsExecutor: GetProductsExecutor;
  readonly #getStocksExecutor: GetStocksExecutor;
  readonly #getAdvertisingListExecutor: GetAdvertingListExecutor;
  readonly #getAdvertingHistoryExecutor: GetAdvertingHistoryExecutor;
  readonly #getAdvertisingPaymentHistoryExecutor: GetAdvertingPaymentHistoryExecutor;
  readonly #getStockReportExecutor: GetStockReportExecutor;
  readonly #getProductStatistic: GetProductStatisticExecutor;
  readonly #getSalesExecutor: GetSalesExecutor;
  readonly #getOrdersExecutor: GetOrdersExecutor;

  constructor(
    organizationRepository: OrganizationRepository,
    advertInfoRepository: AdvertInfoRepository,
    advertDayStatisticRepository: AdvestingDayStatisticRepository,
    advertDayAppsRepository: AdvestingDayAppsRepository,
    advertDayAppsNms: AdvestingDayAppsNmsRepository,
    productRepository: ProductRepository,
    advertingCostHistoryRepository: AdvestingCostHistoryRepository,
    orderRepository: OrderRepository,
    productStatsRepository: HistoryRepository,
    salesRepository: SalesRepository,
    stockRepository: StocksRepository,
    configService: ConfigService,
  ) {
    super();

    // repositories
    this.#organizationRepository = organizationRepository;
    this.#advertInfoRepository = advertInfoRepository;
    this.#advertDayStatisticRepository = advertDayStatisticRepository;
    this.#advertDayAppsRepository = advertDayAppsRepository;
    this.#advertDayAppsNmsRepository = advertDayAppsNms;
    this.#productRepository = productRepository;
    this.#advertingCostHistoryRepository = advertingCostHistoryRepository;
    this.#orderRepository = orderRepository;
    this.#productStatsRepository = productStatsRepository;
    this.#salesRepository = salesRepository;
    this.#stockRepository = stockRepository;
    this.#configService = configService;

    // executors (создаём после инициализации репозиториев)
    this.#getOrganizationInfoExecutor = new GetOrganizationInfoExecutor(this.#organizationRepository,  this.#configService);
    this.#getProductsExecutor = new GetProductsExecutor(this.#productRepository);
    this.#getStocksExecutor = new GetStocksExecutor(this.#stockRepository);
    this.#getAdvertisingListExecutor = new GetAdvertingListExecutor(this.#advertInfoRepository);
    this.#getAdvertingHistoryExecutor = new GetAdvertingHistoryExecutor(
      this.#advertInfoRepository,
      this.#productRepository,
      this.#advertDayStatisticRepository,
      this.#advertDayAppsRepository,
      this.#advertDayAppsNmsRepository
    );
    this.#getAdvertisingPaymentHistoryExecutor = new GetAdvertingPaymentHistoryExecutor(this.#advertingCostHistoryRepository);
    this.#getStockReportExecutor = new GetStockReportExecutor();
    this.#getProductStatistic = new GetProductStatisticExecutor(this.#productRepository, this.#productStatsRepository);
    this.#getSalesExecutor = new GetSalesExecutor(this.#productRepository, this.#salesRepository);
    this.#getOrdersExecutor = new GetOrdersExecutor(this.#orderRepository, this.#productRepository);
  }

  async execute() {
    const initialOrganizations = await this.#organizationRepository.findMany({
      where: { status: OrganizationStatuses.Inited },
    });

    for (const organization of initialOrganizations) {
      const { apiKey, id, organizationName } = organization;

      if(apiKey && id) {
        await this.#getOrganizationInfoExecutor.execute(apiKey, id);
        await this.#getSalesExecutor.execute(apiKey);
        await this.#getProductsExecutor.execute(apiKey, id)
        await this.#getSalesExecutor.execute(apiKey);
        await this.#getOrdersExecutor.execute(apiKey);
        await this.#getProductStatistic.execute(apiKey, organizationName);

        await this.#getAdvertisingListExecutor.execute(apiKey, id)
        await this.#getAdvertingHistoryExecutor.execute(apiKey, id)
        await this.#getAdvertisingPaymentHistoryExecutor.execute(apiKey)
      }
    }
  }
}
