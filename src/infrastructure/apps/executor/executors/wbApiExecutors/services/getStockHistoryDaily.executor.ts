import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import fs from 'fs';
import AdmZip from 'adm-zip';
import * as path from 'node:path';
import Papa from 'papaparse';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { StockCountOnSideRepository } from '@/infrastructure/core/typeOrm/repositories/stockCountOnSide.repository';
import { StockCountOnSideModel } from '@/infrastructure/core/typeOrm/models/stockCountOnSide.model';
import { StockDailyCsvRow } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/stocks.dto';

// Паттерн для определения колонок-дат: "DD.MM.YYYY"
const DATE_COL_RE = /^\d{2}\.\d{2}\.\d{4}$/;

interface DailyStockEntry {
  nmId: number;
  date: Date;
  totalQuantity: number;
  warehouses: Array<{ warehouseName: string; quantity: number }>;
}

export class GetStockHistoryDailyExecutor extends TaskExecutor {
  readonly #header = { 'Content-Type': 'application/json' };

  readonly #createReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads';
  readonly #checkStatusReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads';
  readonly #downloadReport = 'https://seller-analytics-api.wildberries.ru/api/v2/nm-report/downloads/file';

  #axiosService: AxiosInstance;

  readonly #productRepository: ProductRepository;
  readonly #stockOnSideRepository: StockCountOnSideRepository;

  constructor(productRepository: ProductRepository, stockOnSideRepository: StockCountOnSideRepository) {
    super();
    this.#axiosService = axios.create();
    this.#productRepository = productRepository;
    this.#stockOnSideRepository = stockOnSideRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: { ...this.#header, Authorization: `Bearer ${apiKey}` },
    });
  }

  async #waitForReport(idReport: string): Promise<'SUCCESS' | 'FAILED'> {
    const params = { 'filter[downloadIds][]': idReport };

    while (true) {
      try {
        const response = await this.#axiosService.get(this.#checkStatusReport, { params });
        const report = response.data.data.find((item: any) => item.id === idReport);

        if (!report) {
          await new Promise((r) => setTimeout(r, 20000));
          continue;
        }

        if (report.status === 'SUCCESS') return 'SUCCESS';
        if (report.status === 'FAILED') return 'FAILED';

        await new Promise((r) => setTimeout(r, 20000));
      } catch (err) {
        console.error('[StockHistoryDaily] Ошибка проверки статуса:', err);
        break;
      }
    }

    return 'FAILED';
  }

  async #downloadAndParse(downloadId: string, saveDir: string): Promise<Array<StockDailyCsvRow>> {
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    const savePath = path.resolve(saveDir, `${downloadId}.zip`);

    const response = await this.#axiosService.get(`${this.#downloadReport}/${downloadId}`, {
      responseType: 'arraybuffer',
    });

    fs.writeFileSync(savePath, response.data);

    const zip = new AdmZip(savePath);
    const csvEntry = zip.getEntries().find((e) => e.entryName.endsWith('.csv'));

    if (!csvEntry) throw new Error('[StockHistoryDaily] CSV не найден в архиве');

    const parsed = Papa.parse<StockDailyCsvRow>(csvEntry.getData().toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
    });

    console.log('[StockHistoryDaily] CSV строк:', parsed.data.length);
    return parsed.data;
  }

  /**
   * Агрегирует строки CSV по ключу nmId+дата.
   * Каждая строка — один склад (OfficeName) + набор колонок-дат.
   */
  #aggregateRows(rows: Array<StockDailyCsvRow>): Map<string, DailyStockEntry> {
    const acc = new Map<string, DailyStockEntry>();

    for (const row of rows) {
      const nmId = Number(row.NmID);
      if (!nmId) continue;

      const officeName = row.OfficeName || 'Неизвестно';

      for (const key of Object.keys(row)) {
        if (!DATE_COL_RE.test(key)) continue;

        const qty = Number(row[key]) || 0;
        if (qty === 0) continue;

        // DD.MM.YYYY → Date
        const date = DateTime.fromFormat(key, 'dd.MM.yyyy').startOf('day').toJSDate();
        const mapKey = `${nmId}_${key}`;

        if (!acc.has(mapKey)) {
          acc.set(mapKey, { nmId, date, totalQuantity: 0, warehouses: [] });
        }

        const entry = acc.get(mapKey)!;
        entry.totalQuantity += qty;
        entry.warehouses.push({ warehouseName: officeName, quantity: qty });
      }
    }

    return acc;
  }

  async execute(apiKey: string, organizationName: string, organizationId: number): Promise<void> {
    this.#initAxios(apiKey);

    try {
      const idReport = uuidv4();
      const endDate = DateTime.now().minus({ day: 1 });
      const startDate = endDate.minus({ months: 3 });

      const reportParams = {
        id: idReport,
        reportType: 'STOCK_HISTORY_DAILY_CSV',
        userReportName: `${organizationName}-stocks-${idReport}`,
        params: {
          currentPeriod: {
            start: startDate.toISODate(),
            end: endDate.toISODate(),
          },
          skipDeletedNm: false,
          stockType: '',
        },
        aggregationLevel: 'day',
      };

      console.log('[StockHistoryDaily] Создаём отчёт:', reportParams);

      const createResponse = await this.#axiosService.post(this.#createReport, reportParams);

      if (createResponse.status !== 200) {
        console.error('[StockHistoryDaily] Ошибка создания отчёта:', createResponse.status);
        return;
      }

      const status = await this.#waitForReport(idReport);

      if (status !== 'SUCCESS') {
        console.error('[StockHistoryDaily] Отчёт завершился со статусом:', status);
        return;
      }

      const saveDir = `wb-reports/stocks`;
      const rows = await this.#downloadAndParse(idReport, saveDir);
      const aggregated = this.#aggregateRows(rows);

      console.log(`[StockHistoryDaily] Уникальных nmId×дата: ${aggregated.size}`);

      for (const [, entry] of aggregated) {
        const product = await this.#productRepository.findOne({ where: { nmID: entry.nmId, organizationId } });

        if (!product) {
          console.warn(`[StockHistoryDaily] Продукт не найден: nmId=${entry.nmId}`);
          continue;
        }

        const existing = await this.#stockOnSideRepository.findOne({
          where: { nmId: entry.nmId, date: entry.date },
        });

        const payload = new StockCountOnSideModel({
          date: entry.date,
          nmId: entry.nmId,
          quantityFull: entry.totalQuantity,
          inWayToClient: 0,
          inWayFromClient: 0,
          warehouses: entry.warehouses,
          productId: product.id,
        });

        if (existing) {
          await this.#stockOnSideRepository.updateById(existing.id, payload);
        } else {
          await this.#stockOnSideRepository.create(payload);
        }
      }

      console.log('[StockHistoryDaily] История остатков обновлена');
    } catch (error) {
      console.error('[StockHistoryDaily] Ошибка:', error);
    }
  }
}
