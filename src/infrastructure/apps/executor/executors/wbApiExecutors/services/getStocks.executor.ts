import axios, { AxiosInstance } from 'axios';
import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { StocksRepository } from '@/infrastructure/core/typeOrm/repositories/stocks.repository';
import { StocksDtoArray } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/stocks.dto';
import { StocksModel } from '@/infrastructure/core/typeOrm/models/stocks.model';
import { DeepPartial } from 'typeorm';

export class GetStocksExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #baseUrl = 'https://marketplace-api.wildberries.ru/api/v3/offices';
  readonly #stockRepository: StocksRepository;

  #axiosService: AxiosInstance;

  constructor(stockRepository: StocksRepository) {
    super();
    this.#axiosService = axios.create();
    this.#stockRepository = stockRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async execute(apiKey: string, organizationId: number) {
    this.#initAxios(apiKey);

    try {
      const response = await this.#axiosService.get(this.#baseUrl);

      const stocksList: StocksDtoArray = response.data;

      if (stocksList.length === 0) {
        throw Error('Stocks list is empty');
      }

      for (const stock of stocksList) {
        const existingStock = await this.#stockRepository.findOne({ where: { officeId: stock.id } });

        const payload: DeepPartial<StocksModel> = {
          stockExternalId: stock.id,
          stockName: stock.name,
          address: stock.address,
          city: stock.city,
          longitude: stock.longitude,
          latitude: stock.latitude,
          deliveryType: stock.deliveryType,
          cargoType: stock.cargoType,
          federalDistrict: stock.federalDistrict,
          selected: stock.selected,

          officeId: stock.id,
          isProcessing: stock.isProcessing,
          isDeleting: stock.isDeleting,

          organizationId: organizationId,
        };

        if (existingStock) {
          await this.#stockRepository.updateById(existingStock.id, payload);
        } else {
          await this.#stockRepository.create(payload);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
