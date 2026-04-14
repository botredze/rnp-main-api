import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { SalesRepository } from '@/infrastructure/core/typeOrm/repositories/sales.repository';
import { DateTime } from 'luxon';
import { SalesDtoList } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/sales.dto';
import { DeepPartial } from 'typeorm';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';

export class GetSalesExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  readonly #baseUrl = 'https://statistics-api.wildberries.ru/api/v1/supplier/sales';

  #axiosService: AxiosInstance;
  readonly #productRepository: ProductRepository;
  readonly #salesRepository: SalesRepository;

  constructor(productRepository: ProductRepository, salesRepository: SalesRepository) {
    super();
    this.#axiosService = axios.create();
    this.#productRepository = productRepository;
    this.#salesRepository = salesRepository;
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
      const dateMinus90 = DateTime.now().minus({ days: 90 }).toFormat('yyyy-MM-dd');
      console.log(`[Sales] Запрос продаж с ${dateMinus90}`);

      const response = await this.#axiosService.get(`${this.#baseUrl}?dateFrom=${dateMinus90}`);

      if (response.status === 200) {
        const salesList: SalesDtoList = response.data;
        console.log(`[Sales] Получено продаж: ${salesList.length}`);

        let saved = 0, updated = 0, skipped = 0;

        for (const sales of salesList) {
          const product = await this.#productRepository.findOne({ where: { nmID: sales.nmId, organizationId } });

          if (!product) {
            console.warn(`[Sales] Товар не найден: nmId=${sales.nmId}, пропускаем`);
            skipped++;
            continue;
          }

          const existingSale = await this.#salesRepository.findOne({ where: { saleID: sales.saleID } });

          const salePayload: DeepPartial<SalesModel> = {
            date: new Date(sales.date),
            lastChangeDate: new Date(sales.lastChangeDate),
            nmId: sales.nmId.toString(),
            isSupply: sales.isSupply,
            isRealization: sales.isRealization,
            totalPrice: sales.totalPrice,
            discountPercent: sales.discountPercent,
            spp: sales.spp,
            forPay: sales.forPay,
            paymentSaleAmount: sales.paymentSaleAmount,
            finishedPrice: sales.finishedPrice,
            priceWithDisc: sales.priceWithDisc,
            saleID: sales.saleID,
            isCansel: sales.saleID.startsWith('R') ? true : false,
            sticker: sales.sticker,
            gNumber: sales.gNumber,
            srid: sales.srid,
            supplierArticle: sales.supplierArticle,
            warehouseName: sales.warehouseName,
            warehouseType: sales.warehouseType,
            countryName: sales.countryName,
            regionName: sales.regionName,
            barcode: sales.barcode,
            incomeId: sales.incomeID,
            productId: product.id,
          };

          if (existingSale) {
            await this.#salesRepository.updateById(existingSale.id, salePayload);
            updated++;
          } else {
            await this.#salesRepository.create(salePayload);
            saved++;
          }
        }

        console.log(`[Sales] Готово: создано=${saved}, обновлено=${updated}, пропущено=${skipped}`);
      } else {
        console.warn(`[Sales] Неожиданный статус: ${response.status}`);
      }
    } catch (error) {
      console.error('[Sales] Ошибка:', error?.response?.data || error?.message || error);
    }
  }
}
