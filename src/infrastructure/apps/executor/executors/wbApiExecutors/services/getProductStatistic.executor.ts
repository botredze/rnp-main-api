import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { StatisticItem } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/statistic.dto';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';
import * as path from 'node:path';
import Papa from 'papaparse';

export class GetProductStatisticExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #createReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads';
  readonly #checkStatusReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads';
  readonly #downloadReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads/file';

  #axiosService: AxiosInstance;

  readonly #productRepository: ProductRepository;
  readonly #productStatsRepository: HistoryRepository;

  constructor(productRepository: ProductRepository, productStatsRepository: HistoryRepository) {
    super();
    this.#axiosService = axios.create();
    this.#productRepository = productRepository;
    this.#productStatsRepository = productStatsRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async downloadAndParseReport(downloadId: string, saveDir: string): Promise<Array<StatisticItem>> {
    try {
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }

      const savePath = path.resolve(saveDir, `${downloadId}.zip`);

      const response = await this.#axiosService.get(`${this.#downloadReport}/${downloadId}`, {
        responseType: 'arraybuffer',
      });

      fs.writeFileSync(savePath, response.data);

      const zip = new AdmZip(savePath);
      const zipEntries = zip.getEntries();

      if (!zipEntries.length) {
        throw new Error('ZIP-файл пустой');
      }

      const csvEntry = zipEntries.find((e) => e.entryName.endsWith('.csv'));

      if (!csvEntry) {
        throw new Error('CSV-файл в ZIP не найден');
      }

      const csvBuffer = csvEntry.getData();
      const csvString = csvBuffer.toString('utf-8');

      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
      });

      const data: Array<StatisticItem> = parsed.data as Array<StatisticItem>;
      console.log('Парсинг CSV завершён, записей:', data.length);

      return data;
    } catch (err) {
      console.error('Ошибка при скачивании/распаковке/парсинге отчёта:', err);
      throw err;
    }
  }
  async waitForReport(idReport: string) {
    const params = {
      'filter[downloadIds][]': idReport,
    };

    while (true) {
      try {
        const response = await this.#axiosService.get(`${this.#checkStatusReport}`, { params });

        const report = response.data.data.find((item) => item.id === idReport);

        if (!report) {
          console.warn(`Отчёт с id ${idReport} не найден в ответе`);
          await new Promise((resolve) => setTimeout(resolve, 20000));
          continue;
        }

        if (report.status === 'SUCCESS') {
          return 'SUCCESS';
        } else if (report.status === 'FAILED') {
          return 'FAILED';
        }

        await new Promise((resolve) => setTimeout(resolve, 20000));
      } catch (err) {
        console.error('Ошибка при проверке статуса отчёта:', err);
        break;
      }
    }
  }

  async execute(apiKey: string, organizationName: string): Promise<void> {
    this.#initAxios(apiKey);

    try {
      const idReport = uuidv4();

      const endDate = DateTime.now().minus({ day: 1 }); // сегодня
      const startDate = endDate.minus({ months: 3 }); // 3 месяца назад

      const reportParams = {
        id: idReport,
        reportType: 'DETAIL_HISTORY_REPORT',
        userReportName: `${organizationName}-${idReport}`,
        params: {
          startDate: startDate.toISODate(),
          endDate: endDate.toISODate(),
        },
        aggregationLevel: 'day',
        skipDeletedNm: false,
      };

      console.log(reportParams, 'reportParams');
      const createReportReposonse = await this.#axiosService.post(this.#createReport, reportParams);

      if (createReportReposonse.status === 200) {
        const waitReportStatus = await this.waitForReport(idReport);
        if (waitReportStatus === 'SUCCESS') {
          const statisticData = await this.downloadAndParseReport(
            idReport,
            `wb-reports/${reportParams.userReportName}.zip`,
          );

          for (const statistic of statisticData) {
            const product = await this.#productRepository.findOne({ where: { nmID: statistic.nmID } });

            if (!product) {
              throw Error('Product not found');
            }

            const saveStatisticPayload = new HistoryModel({
              date: new Date(statistic.dt),
              openCardCount: statistic.openCardCount,
              nmId: statistic.nmID,
              addToCardCount: statistic.addToCartCount,
              ordersCount: statistic.ordersCount,
              orderSumRub: statistic.ordersSumRub,
              buyOutCount: statistic.buyoutsCount,
              buyOutSumRub: statistic.buyoutsSumRub,
              buyOutPercent: statistic.buyoutPercent,
              addToCardConversion: statistic.addToCartConversion,
              cardToOrderConversion: statistic.cartToOrderConversion,
              addToWishlist: statistic.addToWishlist,
            });

            const existingStatisticItem = await this.#productStatsRepository.findOne({
              where: { date: new Date(statistic.dt), nmId: statistic.nmID },
            });

            if (existingStatisticItem) {
              await this.#productStatsRepository.updateById(existingStatisticItem.id, saveStatisticPayload);
            } else {
              await this.#productStatsRepository.create({
                ...saveStatisticPayload,
                productId: product.id,
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(error, 'error');
    }
  }
}
