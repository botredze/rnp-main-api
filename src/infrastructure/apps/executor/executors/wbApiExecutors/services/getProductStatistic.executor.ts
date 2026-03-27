import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { DateTime } from 'luxon';
import { SalesFunnelHistoryItem } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/statistic.dto';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';

const NM_IDS_CHUNK_SIZE = 20; // API limit: max 20 nmIds per request
const RATE_LIMIT_DELAY_MS = 22000; // 3 req/min → 22 сек между запросами

export class GetProductStatisticExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #baseUrl =
    'https://seller-analytics-api.wildberries.ru/api/analytics/v3/sales-funnel/products/history';

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

  async execute(apiKey: string, organizationName: string, organizationId: number): Promise<void> {
    this.#initAxios(apiKey);

    try {
      // Получаем nmID всех активных продуктов организации
      const products = await this.#productRepository.findMany({
        where: { organizationId },
      });

      if (!products.length) {
        console.warn(`[ProductStat] Нет продуктов для org=${organizationName}, пропускаем`);
        return;
      }

      const allNmIds = products.map((p) => p.nmID);
      console.log(`[ProductStat] Продуктов в организации: ${allNmIds.length}`);

      const endDate = DateTime.now().minus({ days: 1 });
      const startDate = endDate.minus({ days: 6 }); // max 7 дней для этого endpoint

      // Разбиваем на чанки по 20 (API limit)
      const chunks: number[][] = [];
      for (let i = 0; i < allNmIds.length; i += NM_IDS_CHUNK_SIZE) {
        chunks.push(allNmIds.slice(i, i + NM_IDS_CHUNK_SIZE));
      }

      console.log(
        `[ProductStat] Запрос статистики: от ${startDate.toISODate()} до ${endDate.toISODate()}, org=${organizationName}, чанков=${chunks.length}`,
      );

      const allItems: SalesFunnelHistoryItem[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const requestBody = {
          selectedPeriod: {
            start: startDate.toISODate(),
            end: endDate.toISODate(),
          },
          nmIds: chunk,
          skipDeletedNm: false,
          aggregationLevel: 'day',
        };

        const response = await this.#axiosService.post<SalesFunnelHistoryItem[]>(
          this.#baseUrl,
          requestBody,
        );

        if (response.status !== 200) {
          console.warn(`[ProductStat] Неожиданный статус чанка ${i + 1}: ${response.status}`);
          continue;
        }

        allItems.push(...(response.data ?? []));
        console.log(`[ProductStat] Чанк ${i + 1}/${chunks.length}: получено ${response.data?.length ?? 0} артикулов`);

        // Rate limit: 3 req/min — ждём между запросами
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY_MS));
        }
      }

      console.log(`[ProductStat] Всего получено артикулов: ${allItems.length}`);

      let saved = 0,
        updated = 0,
        skipped = 0;

      for (const item of allItems) {
        const nmId = item.product?.nmId;

        if (!nmId) continue;

        const product = await this.#productRepository.findOne({
          where: { nmID: nmId, organizationId },
        });

        if (!product) {
          skipped++;
          continue;
        }

        for (const day of item.history ?? []) {
          const date = new Date(day.date);

          const payload = new HistoryModel({
            date,
            nmId,
            openCardCount: day.openCount ?? 0,
            addToCardCount: day.cartCount ?? 0,
            ordersCount: day.orderCount ?? 0,
            orderSumRub: day.orderSum ?? 0,
            buyOutCount: day.buyoutCount ?? 0,
            buyOutSumRub: day.buyoutSum ?? 0,
            buyOutPercent: day.buyoutPercent ?? 0,
            addToCardConversion: day.addToCartConversion ?? 0,
            cardToOrderConversion: day.cartToOrderConversion ?? 0,
            addToWishlist: day.addToWishlistCount ?? 0,
          });

          const existing = await this.#productStatsRepository.findOne({
            where: { date, nmId },
          });

          if (existing) {
            await this.#productStatsRepository.updateById(existing.id, payload);
            updated++;
          } else {
            await this.#productStatsRepository.create({
              ...payload,
              productId: product.id,
            });
            saved++;
          }
        }
      }

      if (skipped > 0) {
        console.warn(`[ProductStat] Пропущено артикулов (не найдены в орг): ${skipped}`);
      }

      console.log(`[ProductStat] Готово: создано=${saved}, обновлено=${updated}, пропущено=${skipped}`);
    } catch (error) {
      console.error('[ProductStat] Ошибка:', error?.response?.data || error?.message || error);
    }
  }
}
