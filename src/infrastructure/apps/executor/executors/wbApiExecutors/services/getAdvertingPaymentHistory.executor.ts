import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import {
  AdvestingCostHistoryRepository
} from '@/infrastructure/core/typeOrm/repositories/advestingCostHistory.repository';
import { DateTime } from 'luxon';
import { AdvertPayHistory } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/advert.dto';
import { AdvertisingCostHistoryModel } from '@/infrastructure/core/typeOrm/models/advestingCostHistory.model';


export class GetAdvertingPaymentHistoryExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  }

  readonly #baseUrl = 'https://advert-api.wildberries.ru/adv/v1/upd'
  #axiosService: AxiosInstance

  readonly #advestingCostHistoryRepository: AdvestingCostHistoryRepository

  constructor(advestingCostHistoryRepository: AdvestingCostHistoryRepository) {
    super();
    this.#axiosService = axios.create();
    this.#advestingCostHistoryRepository = advestingCostHistoryRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }


  async execute(apiKey: string): Promise<void>{
    this.#initAxios(apiKey);

    try {
      const to = DateTime.now().toISODate(); // сегодня
      const from = DateTime.now().minus({ days: 30 }).toISODate(); // 30 дней назад

      const response = await this.#axiosService.get(this.#baseUrl,
        {
          params: {
            from,
            to
          }
        }
        )

      if(response.status === 200) {
        const paymentHistoryData: Array<AdvertPayHistory>  = response.data;

        for (const payment of paymentHistoryData) {
          const existingPayment = await this.#advestingCostHistoryRepository.findOne({
            where: {
              advertisingId: payment.advertId,
              updTime: new Date(payment.updTime),
            },
          });

          const historyPayload = new AdvertisingCostHistoryModel({
            updTime: new Date(payment.updTime),
            updSum: payment.updSum,
            advertType: payment.advertType,
            advertStatus: payment.advertStatus,
            campName: payment.campName,
            advertisingId: existingPayment ? existingPayment.advertisingId : payment.advertId,
          })

          if(existingPayment) {
            await this.#advestingCostHistoryRepository.updateById(existingPayment.id, historyPayload)
          }else {
            await this.#advestingCostHistoryRepository.create(historyPayload)
          }
        }
      }

    }catch (error) {
      console.log(error, 'error');
    }
  }
}