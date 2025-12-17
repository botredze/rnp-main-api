import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { DateTime } from 'luxon';
import { AdvertStats } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/advert.dto';
import { AdvertInfoRepository } from '@/infrastructure/core/typeOrm/repositories/advestingInfo.repository';
import { AdvestingDayStatisticRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayStatistic.repository';
import { AdvestingDayAppsRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayApps.repository';
import { AdvestingDayAppsNmsRepository } from '@/infrastructure/core/typeOrm/repositories/advestingDayAppsNms.repository';
import { In } from 'typeorm';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { AdvertisingDayAppNmModel } from '@/infrastructure/core/typeOrm/models/advestingDayAppsNms.model';
import { AdvertisingDayAppModel } from '@/infrastructure/core/typeOrm/models/adverstingDayApps.model';

export class GetAdvertingHistoryExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #baseUrl = 'https://advert-api.wildberries.ru/adv/v3/fullstats';
  #axiosService: AxiosInstance;

  readonly #advertInfoRepository: AdvertInfoRepository;
  readonly #advertDayStatisticRepository: AdvestingDayStatisticRepository;
  readonly #advertDayAppsRepository: AdvestingDayAppsRepository;
  readonly #advertDayAppsNms: AdvestingDayAppsNmsRepository;
  readonly #productRepository: ProductRepository;

  constructor(
    advertInfoRepository: AdvertInfoRepository,
    productRepository: ProductRepository,
    advertDayStatisticRepository: AdvestingDayStatisticRepository,
    advertDayAppsRepository: AdvestingDayAppsRepository,
    advertDayAppsNms: AdvestingDayAppsNmsRepository,
  ) {
    super();
    this.#axiosService = axios.create();
    this.#advertInfoRepository = advertInfoRepository;
    this.#advertDayStatisticRepository = advertDayStatisticRepository;
    this.#advertDayAppsRepository = advertDayAppsRepository;
    this.#advertDayAppsNms = advertDayAppsNms;
    this.#productRepository = productRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async execute(apiKey: string, organizationId: number): Promise<void> {
    this.#initAxios(apiKey);

    try {
      const advertList = await this.#advertInfoRepository.findMany({
        where: {
          organizationId,
          status: In([7, 9, 11]),
        },
      });

      const ids = advertList.map((ad) => ad.advertId);

      // Разбить на пачки <= 50
      const chunkSize = 50;
      const idChunks = [];
      for (let i = 0; i < ids.length; i += chunkSize) {
        idChunks.push(ids.slice(i, i + chunkSize));
      }

      const endDate = DateTime.now().toISODate();
      const beginDate = DateTime.now().minus({ days: 30 }).toISODate();

      for (let i = 0; i < idChunks.length; i++) {
        const chunk = idChunks[i];

        console.log(`Запрос ${i + 1}/${idChunks.length} — ${chunk.length} реклам`);

        const response = await this.#axiosService.get(this.#baseUrl, {
          params: {
            ids: chunk.join(','),
            beginDate,
            endDate,
          },
        });

        if (response.status === 200) {
          const advertStatsData: Array<AdvertStats> = response.data ?? [];

          for (const advertStats of advertStatsData) {
            for (const day of advertStats.days) {
              const advesting = await this.#advertInfoRepository.findOne({
                where: { advertId: advertStats.advertId },
              });

              const existingStats = await this.#advertDayStatisticRepository.findOne({
                where: {
                  date: new Date(day.date),
                  advertisingId: advesting.id,
                },
              });

              let createdDayStats = { id: null };

              const dayPayload = new AdvertisingDayStatisticModel({
                date: new Date(day.date),
                atbs: day.atbs,
                canceled: day.canceled,
                clicks: day.clicks,
                cpc: day.cpc,
                ctr: day.ctr,
                orders: day.orders,
                shks: day.shks,
                sum: day.sum,
                sumPrice: day.sum_price,
                views: day.views,
                advertisingId: advesting.id,
              });

              if (existingStats) {
                await this.#advertDayStatisticRepository.updateById(existingStats.id, dayPayload);
                createdDayStats.id = existingStats.id;
              } else {
                const created = await this.#advertDayStatisticRepository.create(dayPayload);
                createdDayStats.id = created.id;
              }

              for (const app of day.apps) {
                let appRecord = await this.#advertDayAppsRepository.findOne({
                  where: { dayStatisticId: createdDayStats.id, appType: app.appType },
                });

                const appPayload = new AdvertisingDayAppModel({
                  dayStatisticId: createdDayStats.id,
                  appType: app.appType,
                  atbs: app.atbs,
                  canceled: app.canceled,
                  clicks: app.clicks,
                  cpc: app.cpc,
                  ctr: app.ctr,
                  orders: app.orders,
                  shks: app.shks,
                  sum: app.sum,
                  sum_price: app.sum_price,
                  views: app.views,
                });

                if (appRecord) {
                  await this.#advertDayAppsRepository.updateById(appRecord.id, appPayload);
                } else {
                  appRecord = await this.#advertDayAppsRepository.create(appPayload);
                }

                for (const nm of app.nms) {
                  const product = await this.#productRepository.findOne({ where: { nmID: nm.nmId } });
                  if (!product) continue;

                  const nmRecord = await this.#advertDayAppsNms.findOne({
                    where: { appStatisticId: appRecord.id, nmId: nm.nmId },
                  });

                  const nmPayload = new AdvertisingDayAppNmModel({
                    appStatisticId: appRecord.id,
                    nmId: nm.nmId,
                    atbs: nm.atbs,
                    canceled: nm.canceled,
                    clicks: nm.clicks,
                    cpc: nm.cpc,
                    ctr: nm.ctr,
                    orders: nm.orders,
                    shks: nm.shks,
                    sum: nm.sum,
                    sum_price: nm.sum_price,
                    views: nm.views,
                    productId: product.id,
                  });

                  if (nmRecord) {
                    await this.#advertDayAppsNms.updateById(nmRecord.id, nmPayload);
                  } else {
                    await this.#advertDayAppsNms.create(nmPayload);
                  }
                }
              }
            }
          }
        }

        // ============ TIMEOUT 1 МИНУТА МЕЖДУ ЗАПРОСАМИ ============
        if (i < idChunks.length - 1) {
          console.log('Ждём 60 секунд...');
          await new Promise((res) => setTimeout(res, 60_000));
        }
      }

      console.log('Статистика рекламных компаний');
    } catch (error) {
      console.log(error, 'error');
    }
  }
}
