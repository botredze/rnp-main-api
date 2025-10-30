import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import {
  IAdvertDto,
  IAdvertInfoDetails,
  IAdvertInfoDetailsArray,
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/advert.dto';
import { AdvertisingModel } from '@/infrastructure/core/typeOrm/models/advertising.model';
import { stringifyJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { DeepPartial } from 'typeorm';
import { AdvertInfoRepository } from '@/infrastructure/core/typeOrm/repositories/advestingInfo.repository';


export class GetAdvertingListExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  }

  readonly #advertList = 'https://advert-api.wildberries.ru/adv/v1/promotion/count'
  readonly #advertInfo = 'https://advert-api.wildberries.ru/adv/v1/promotion/adverts'
  readonly #advertingInfoRepository: AdvertInfoRepository;

  #axiosService: AxiosInstance;


  constructor(
    advertingInfoRepository: AdvertInfoRepository,
  ) {
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

  async execute(apiKey: string, organizationId: number) : Promise<void>{
    this.#initAxios(apiKey);
    try {
      const advertListResponse = await this.#axiosService.get(this.#advertList)

      if(advertListResponse.status === 200) {
        const advertList: IAdvertDto = advertListResponse.data

        for (const advert of advertList.adverts) {
          const body: Array<number> = advert.advert_list.map((a) => a.advertId);

          if (body.length === 0) {
            console.log(`Нет advertId для типа ${advert.type}`);
            continue;
          }

          const advertInfoResponse = await this.#axiosService.post(this.#advertInfo, body)

          if (advertInfoResponse.status === 200) {
            const advertInfoDetails: IAdvertInfoDetailsArray = advertInfoResponse.data

            for (const advertInfoDetail of advertInfoDetails) {
              const existingAdvert = await  this.#advertingInfoRepository.findOne({where: {advertId: advertInfoDetail.advertId}})

              const payload: DeepPartial<AdvertisingModel> = {
                advertId: advertInfoDetail.advertId,
                advertName: advertInfoDetail.name,
                startTime: advertInfoDetail.startTime,
                endTime: advertInfoDetail.endTime,
                status:  advertInfoDetail.status,
                type: advertInfoDetail.status,
                dailyBudget: advertInfoDetail.dailyBudget,
                autoParams: stringifyJson(advertInfoDetail.autoParams),
                organizationId
              }

              if(existingAdvert) {
                await this.#advertingInfoRepository.updateById(existingAdvert.id, payload)
              }else {
                await this.#advertingInfoRepository.create(payload)
              }
            }
          }
        }
      }
    }catch (error) {
      console.log(error);
    }
  }
}