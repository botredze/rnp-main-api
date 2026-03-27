import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import {
  IAdvertDto,
  IAdvertV2InfoDetails,
  IAdvertV2Response,
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/advert.dto';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { stringifyJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { DeepPartial } from 'typeorm';
import { AdvertInfoRepository } from '@/infrastructure/core/typeOrm/repositories/advestingInfo.repository';

const CHUNK_SIZE = 50;

export class GetAdvertingListExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #advertList = 'https://advert-api.wildberries.ru/adv/v1/promotion/count';
  readonly #advertInfo = 'https://advert-api.wildberries.ru/api/advert/v2/adverts';
  readonly #advertingInfoRepository: AdvertInfoRepository;

  #axiosService: AxiosInstance;

  constructor(advertingInfoRepository: AdvertInfoRepository) {
    super();
    this.#axiosService = axios.create();
    this.#advertingInfoRepository = advertingInfoRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  #chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  async #saveAdvert(advert: IAdvertV2InfoDetails, organizationId: number): Promise<'created' | 'updated'> {
    const existingAdvert = await this.#advertingInfoRepository.findOne({
      where: { advertId: advert.id },
    });

    const now = new Date().toISOString();

    const payload: DeepPartial<AdvertisingModel> = {
      advertId: advert.id,
      advertName: advert.settings?.name ?? '',
      startTime: advert.timestamps?.started ?? advert.timestamps?.created ?? now,
      endTime: advert.timestamps?.deleted ?? advert.timestamps?.updated ?? now,
      status: advert.status,
      type: advert.status,
      dailyBudget: 0,
      autoParams: stringifyJson(advert.nm_settings),
      organizationId,
    };

    if (existingAdvert) {
      await this.#advertingInfoRepository.updateById(existingAdvert.id, payload);
      return 'updated';
    } else {
      await this.#advertingInfoRepository.create(payload);
      return 'created';
    }
  }

  async execute(apiKey: string, organizationId: number): Promise<void> {
    this.#initAxios(apiKey);
    try {
      console.log(`[AdvertList] Запрос списка кампаний, orgId=${organizationId}`);
      const advertListResponse = await this.#axiosService.get(this.#advertList);

      if (advertListResponse.status !== 200) {
        console.warn(`[AdvertList] Неожиданный статус: ${advertListResponse.status}`);
        return;
      }

      const advertList: IAdvertDto = advertListResponse.data;
      const allIds: number[] = (advertList.adverts ?? []).flatMap((a) =>
        a.advert_list.map((item) => item.advertId),
      );

      const totalInList = allIds.length;
      console.log(`[AdvertList] Типов: ${advertList.adverts?.length ?? 0}, всего кампаний: ${totalInList}`);

      if (totalInList === 0) {
        console.log('[AdvertList] Нет кампаний для обновления');
        return;
      }

      let saved = 0,
        updated = 0;

      const chunks = this.#chunkArray(allIds, CHUNK_SIZE);

      for (const chunk of chunks) {
        const advertInfoResponse = await this.#axiosService.get<IAdvertV2Response>(this.#advertInfo, {
          params: { ids: chunk.join(',') },
        });

        if (advertInfoResponse.status !== 200) {
          console.warn(`[AdvertList] Неожиданный статус деталей: ${advertInfoResponse.status}`);
          continue;
        }

        const adverts = advertInfoResponse.data?.adverts ?? [];

        for (const advert of adverts) {
          const result = await this.#saveAdvert(advert, organizationId);
          if (result === 'created') saved++;
          else updated++;
        }
      }

      console.log(`[AdvertList] Готово: создано=${saved}, обновлено=${updated}`);
    } catch (error) {
      console.error('[AdvertList] Ошибка:', error?.response?.data || error?.message || error);
    }
  }
}
