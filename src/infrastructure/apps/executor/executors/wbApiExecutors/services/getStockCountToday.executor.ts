import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { ProductStockInfo } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/stocks.dto';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { DateTime } from 'luxon';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { OrganizationStatuses } from '@/infrastructure/core/typeOrm/models/organizations.model';

export class GetStockCountTodayExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #createTaskUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains';
  readonly #checkStatusUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains/tasks';
  readonly #getReportUrl = 'https://seller-analytics-api.wildberries.ru/api/v1/warehouse_remains/tasks';
  #axiosService: AxiosInstance;

  readonly #stockCountRepository: StockCountRepository;
  readonly #productRepository: ProductRepository;

  readonly #organizationRepository: OrganizationRepository;

  constructor(
    stockCountRepository: StockCountRepository,
    productRepository: ProductRepository,
    organizationRepository: OrganizationRepository,
  ) {
    super();
    this.#axiosService = axios.create();
    this.#stockCountRepository = stockCountRepository;
    this.#productRepository = productRepository;
    this.#organizationRepository = organizationRepository;
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

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.log(error, 'error');
        throw error;
      }
    }
  }

  async execute(): Promise<void> {
    const organizations = await this.#organizationRepository.findMany({
      where: { status: OrganizationStatuses.Active },
    });
    const EXCLUDE = ['В пути до получателей', 'В пути возвраты на склад WB'];

    if (organizations.length === 0) {
      throw Error('Organization not found');
    }

    for (const organization of organizations) {
      const apiKey = organization.apiKey;
      this.#initAxios(apiKey);

      if (!apiKey) {
        throw Error('API key not found for organization');
      }

      try {
        const createReportResponse = await this.#axiosService.get(this.#createTaskUrl);

        if (createReportResponse.status === 200) {
          const taskId = createReportResponse.data.taskId;

          const resultCheckStatus = await this.waitForTaskDone(taskId);

          if (resultCheckStatus) {
            const getReportResult = await this.#axiosService.get(`${this.#getReportUrl}/${taskId}/download`);

            if (getReportResult.status === 200) {
              const stockCountReport: Array<ProductStockInfo> = getReportResult.data;

              for (const stockData of stockCountReport) {
                const product = await this.#productRepository.findOne({ where: { nmID: stockData.nmId } });

                if (!product) {
                  throw Error('Product not found');
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

                const stockSavePayload = new StockCountModel({
                  date: todayDate,
                  lastChangeDate: todayDate,
                  warehouseName: stockData.warehouses?.map((w) => w.warehouseName).join(', '),
                  nmId: stockData.nmId,
                  techSize: stockData.techSize,
                  brand: stockData.brand,
                  subject: stockData.subjectName,
                  quantityFull: totalQuantity,
                  inWayToClient,
                  inWayFromClient,
                  productId: product.id,
                });

                await this.#stockCountRepository.create(stockSavePayload);
              }
            }
          }
        }
      } catch (error) {
        console.log(error, 'error');
      }
    }
  }
}
