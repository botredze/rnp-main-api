import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';
import { OrderRepository } from '@/infrastructure/core/typeOrm/repositories/order.repository';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { DateTime } from 'luxon';
import { OrderDtoList } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/order.dto';
import { DeepPartial } from 'typeorm';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';

export class GetOrdersExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  }

  readonly #baseUrl = 'https://statistics-api.wildberries.ru/api/v1/supplier/orders'
  #axiosService: AxiosInstance
  readonly #orderRepository: OrderRepository;
  readonly #productRepository: ProductRepository;

  constructor(orderRepository: OrderRepository, productRepository: ProductRepository,) {
    super();
    this.#axiosService = axios.create();
    this.#orderRepository = orderRepository;
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


  async execute(apiKey: string, organizationId: number): Promise<void>{
    this.#initAxios(apiKey);

    try {
      const dateMinus90 = DateTime.now().minus({ days: 90 }).toFormat('yyyy-MM-dd');
      console.log(`[Orders] Запрос заказов с ${dateMinus90}`);

      const response = await this.#axiosService.get(`${this.#baseUrl}?dateFrom=${dateMinus90}`);

      if(response.status === 200) {
        const ordersList: OrderDtoList = response.data;
        console.log(`[Orders] Получено заказов: ${ordersList.length}`);

        let saved = 0, updated = 0, skipped = 0;

        for(const order of ordersList) {
          const product = await this.#productRepository.findOne({where: {nmID: order.nmId, organizationId}})
          if(!product) {
            console.warn(`[Orders] Товар не найден: nmId=${order.nmId}, пропускаем`);
            skipped++;
            continue;
          }

          const savePayload: DeepPartial<OrderModel> = {
            date: new Date(order.date),
            lastChangeDate: new Date(order.lastChangeDate),
            warehouseName: order.warehouseName,
            warehouseType: order.warehouseType,
            countryName: order.countryName,
            oblastOkrugName: order.oblastOkrugName,
            regionName: order.regionName,
            supplierArticle: order.supplierArticle,
            nmId: order.nmId,
            barcode: order.barcode,
            category: order.category,
            subject: order.subject,
            brand: order.brand,
            techSize: order.techSize,
            incomeID: order.incomeID,
            isSupply: order.isSupply,
            isRealization: order.isRealization,
            totalPrice: order.totalPrice,
            discountPercent: order.discountPercent,
            spp: order.spp,
            finishedPrice: order.finishedPrice,
            priceWithDisc: order.priceWithDisc,
            isCancel: order.isCancel,
            cancelDate: order.cancelDate ? new Date(order.cancelDate) : null,
            sticker: order.sticker,
            gNumber: order.gNumber,
            srid: order.srid,
          };

          const existingOrder = await this.#orderRepository.findOne({where: {srid: order.srid}})

          if(existingOrder){
            await this.#orderRepository.updateById(existingOrder.id, savePayload);
            updated++;
          }else {
            await this.#orderRepository.create({
              ...savePayload,
              productId: product.id,
            });
            saved++;
          }
        }

        console.log(`[Orders] Готово: создано=${saved}, обновлено=${updated}, пропущено=${skipped}`);
      } else {
        console.warn(`[Orders] Неожиданный статус: ${response.status}`);
      }
    }catch (error) {
      console.error('[Orders] Ошибка:', error?.response?.data || error?.message || error);
    }
  }
}