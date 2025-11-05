import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { DateTime } from 'luxon';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import { WarehouseStatistic } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/stocks.dto';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { StocksRepository } from '@/infrastructure/core/typeOrm/repositories/stocks.repository';

export class GetStockReportExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #createTask = 'https://seller-analytics-api.wildberries.ru/api/v1/paid_storage';
  readonly #getStatusTask = 'https://seller-analytics-api.wildberries.ru/api/v1/paid_storage/tasks';
  readonly #getReport = 'https://seller-analytics-api.wildberries.ru/api/v1/paid_storage/tasks';

  readonly #stockCountRepository: StockCountRepository;
  readonly #productRepository: ProductRepository;
  readonly #stocksRepository: StocksRepository;

  #axiosService: AxiosInstance;

  constructor(
    stockCountRepository: StockCountRepository,
    productRepository: ProductRepository,
    stocksRepository: StocksRepository,
  ) {
    super();
    this.#axiosService = axios.create();
    this.#stockCountRepository = stockCountRepository;
    this.#productRepository = productRepository;
    this.#stocksRepository = stocksRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async waitForTaskDone(taskId: string): Promise<boolean> {
    const statusUrl = `${this.#getStatusTask}/${taskId}/status`;

    while (true) {
      try {
        const statusResponse = await this.#axiosService.get(statusUrl);

        if (statusResponse.status === 200) {
          const taskStatus = statusResponse.data?.data?.status;
          console.log(`Текущий статус задачи: ${taskStatus}`);

          if (taskStatus === 'done') return true;
          if (taskStatus === 'failed') return false;
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (err) {
        console.error('Ошибка при проверке статуса задачи:', err);
        throw err;
      }
    }
  }

  async execute(apiKey: string): Promise<void> {
    this.#initAxios(apiKey);

    try {
      const dateTo = DateTime.now().minus({ days: 1 }).toFormat('yyyy-MM-dd');

      const dateFrom = DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd');

      const createTaskResponse = await this.#axiosService.post(
        `${this.#createTask}?dateFrom=${dateFrom}&dateTo=${dateTo}?`,
      );

      if (createTaskResponse.status === 200) {
        const taskId = createTaskResponse.data?.data?.id;
        const checkTaskStatus = await this.waitForTaskDone(taskId);

        if (checkTaskStatus) {
          const getResultStatus = await this.#axiosService.get(`${this.#getReport}/${taskId}/download`);

          if (getResultStatus.status === 200) {
            const stockReport: WarehouseStatistic = getResultStatus.data;

            for (const stockData of stockReport) {
              const existData = await this.#stockCountRepository.findOne({
                where: { date: new Date(stockData.date), nmId: stockData.nmId },
              });

              const stock = await this.#stocksRepository.findOne({ where: { officeId: stockData.officeId } });
              const product = await this.#productRepository.findOne({ where: { nmID: stockData.nmId } });

              if (!product || !stock) {
                throw Error('Product or stock not found');
              }

              const savePayload = new StockCountModel({
                date: new Date(stockData.date),
                lastChangeDate: stockData.originalDate ? new Date(stockData.originalDate) : null,
                warehouseName: stockData.warehouse ?? null,
                logWarehouseCoef: stockData.logWarehouseCoef ?? null,
                supplierArticle: stockData.vendorCode ?? null,
                nmId: stockData.nmId,
                barcode: stockData.barcode ?? null,
                quantity: Number(stockData.volume) || 0,
                category: stockData.subject ?? null,
                subject: stockData.subject ?? null,
                brand: stockData.brand ?? null,
                techSize: stockData.size ?? null,
                price: Number(stockData.warehousePrice) || 0,
                discount: Number(stockData.loyaltyDiscount) || 0,
                SCCode: stockData.palletPlaceCode?.toString() ?? null,
                avgOrdersByMouth: Number(stockData.volume) || 0,
                productId: product.id,
              });

              if (existData) {
                await this.#stockCountRepository.updateById(existData.id, savePayload);
              } else {
                await this.#stockCountRepository.create({
                  ...savePayload,
                  productId: product.id,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error, 'error');
    }
  }
}
