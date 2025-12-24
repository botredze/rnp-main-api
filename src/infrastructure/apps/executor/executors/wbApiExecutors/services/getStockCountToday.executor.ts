import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { ProductStockInfo } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/stocks.dto';
import { DateTime } from 'luxon';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';
import { StockCountOnSideRepository } from '@/infrastructure/core/typeOrm/repositories/stockCountOnSide.repository';

export class GetStockCountTodayExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #createTaskUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains';
  readonly #checkStatusUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains/tasks';
  readonly #getReportUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains/tasks';
  #axiosService: AxiosInstance;

  readonly #productRepository: ProductRepository;

  readonly #organizationRepository: OrganizationRepository;

  readonly #stockOnSiteRepository: StockCountOnSideRepository;

  constructor(
    productRepository: ProductRepository,
    organizationRepository: OrganizationRepository,
    stockOnSiteRepository: StockCountOnSideRepository,
  ) {
    super();
    this.#axiosService = axios.create();
    this.#productRepository = productRepository;
    this.#organizationRepository = organizationRepository;
    this.#stockOnSiteRepository = stockOnSiteRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async waitForTaskDone(taskId: string) {
    const statusUrl = `${this.#checkStatusUrl}/${taskId}/status`;

    while (true) {
      try {
        const statusResponse = await this.#axiosService.get(statusUrl);

        if (statusResponse.status === 200) {
          const taskStatus = statusResponse.data?.data?.status;

          if (taskStatus === 'done') return true;
          if (taskStatus === 'canceled') return false;

          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.log(error, 'error');
        throw error;
      }
    }
  }

  async execute(apiKey: string): Promise<void> {
    this.#initAxios(apiKey);

    const EXCLUDE = ['В пути до получателей', 'В пути возвраты на склад WB'];

    const params = new URLSearchParams();

    // locale
    params.set('locale', 'ru'); // ru | en | zh

    // groupBy*
    params.set('groupByBrand', 'false');
    params.set('groupBySubject', 'false');
    params.set('groupBySa', 'true');
    params.set('groupByNm', 'true');
    params.set('groupByBarcode', 'true');
    params.set('groupBySize', 'true');

    // filters
    params.set('filterPics', '0'); // -1 | 0 | 1
    params.set('filterVolume', '0'); // -1 | 0 | 3

    try {
      const createReportResponse = await this.#axiosService.get(this.#createTaskUrl, { params });

      if (createReportResponse.status === 200) {
        const taskId = createReportResponse?.data?.data?.taskId;

        const resultCheckStatus = await this.waitForTaskDone(taskId);

        if (resultCheckStatus) {
          const getReportResult = await this.#axiosService.get(`${this.#getReportUrl}/${taskId}/download`);

          if (getReportResult.status === 200) {
            const stockCountReport: Array<ProductStockInfo> = getReportResult.data;

            for (const stockData of stockCountReport) {
              const product = await this.#productRepository.findOne({ where: { nmID: stockData.nmId } });

              if (!product) {
                console.log('product not found,', stockData.nmId);
                continue;
              }

              let inWayToClient = 0;
              let inWayFromClient = 0;
              let totalQuantity = 0;

              for (const warehouseItem of stockData.warehouses ?? []) {
                const name = warehouseItem.warehouseName;
                const qty = warehouseItem.quantity ?? 0;

                if (name === 'В пути до получателей') {
                  inWayToClient += qty;
                } else if (name === 'В пути возвраты на склад WB') {
                  inWayFromClient += qty;
                } else if (!EXCLUDE.includes(name)) {
                  totalQuantity += qty;
                }
              }
              const todayDate = DateTime.now().toJSDate();

              const stockSavePayload = new StockCountOnSideModel({
                date: todayDate,
                nmId: stockData.nmId,
                techSize: stockData.techSize,
                brand: stockData.brand,
                barcode: stockData.barcode,
                subject: stockData.subjectName,
                quantityFull: totalQuantity,
                inWayToClient,
                inWayFromClient,
                warehouses: stockData.warehouses,
                productId: product.id,
              });

              await this.#stockOnSiteRepository.create(stockSavePayload);
            }
          }
        }
      }
    } catch (error) {
      console.log(error, 'error');
    }
  }
}
