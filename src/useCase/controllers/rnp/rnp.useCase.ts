import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { GetProductListQuery, GetRnpAnalyticsDto } from '@/shared/dtos/rnpAnalitics.dto';
import { parseJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { SalesRepository } from '@/infrastructure/core/typeOrm/repositories/sales.repository';
import { OrderRepository } from '@/infrastructure/core/typeOrm/repositories/order.repository';
import { HistoryRepository } from '@/infrastructure/core/typeOrm/repositories/history.repository';
import { StockCountRepository } from '@/infrastructure/core/typeOrm/repositories/stockCount.repository';
import {
  AdvestingDayStatisticRepository
} from '@/infrastructure/core/typeOrm/repositories/advestingDayStatistic.repository';
import { DateTime } from 'luxon';

export class RnpUseCase {
  readonly #productRepository: ProductRepository;

  readonly #salesRepository: SalesRepository;
  readonly #ordersRepository: OrderRepository;
  readonly #historyRepository: HistoryRepository;

  readonly #stockCountRepository: StockCountRepository;
  readonly #advestingDayStatisticRepository: AdvestingDayStatisticRepository;

  constructor(
    productRepository: ProductRepository,
    salesRepository: SalesRepository,
    orderRepository: OrderRepository,
    historyRepository: HistoryRepository,
    stockCountRepository: StockCountRepository,
    advestingDayStatisticRepository: AdvestingDayStatisticRepository,
  ) {
    this.#productRepository = productRepository;
    this.#salesRepository = salesRepository;
    this.#ordersRepository = orderRepository;
    this.#historyRepository = historyRepository;
    this.#stockCountRepository = stockCountRepository;
    this.#advestingDayStatisticRepository = advestingDayStatisticRepository;
  }

  async getList(query: GetProductListQuery) {
    const { organizationId } = query;

    const products = await this.#productRepository.findMany({ where: { organizationId } });

    if (products.length === 0) {
      return [];
    }

    return products.map((product) => ({
      ...product,
      characteristics: parseJson(product.characteristics),
      sizes: parseJson(product.sizes),
      photos: parseJson(product.photos),
    }));
  }

  getRnpTimePeriod(query: GetRnpAnalyticsDto) {
    const { startDate, endDate, periodTypes } = query;

    let responseStartDate: string;
    let responseEndDate: string;

    const today = DateTime.now();

    switch (periodTypes) {
      case 'custom':
        responseStartDate = startDate!;
        responseEndDate = endDate!;
        break;

      case 'day':
        responseStartDate = today.startOf('day').toISODate(); // "2025-11-08"
        responseEndDate = today.endOf('day').toISODate(); // "2025-11-08"
        break;

      case 'week':
        responseStartDate = today.startOf('week').toISODate(); // понедельник
        responseEndDate = today.endOf('week').toISODate(); // воскресенье
        break;

      case 'month':
        responseStartDate = today.startOf('month').toISODate(); // 1 число месяца
        responseEndDate = today.endOf('month').toISODate(); // последнее число месяца
        break;

      case 'quarter':
        responseStartDate = today.startOf('quarter').toISODate();
        responseEndDate = today.endOf('quarter').toISODate();
        break;

      case 'allTime':
        responseStartDate = '2025-01-01';
        responseEndDate = today.toISODate();
        break;
    }

    return { responseStartDate, responseEndDate };
  }

  async getRnpAnalytics(query: GetRnpAnalyticsDto): Promise<any> {
    console.log(query, 'query');
    const { productId } = query;

    const { responseStartDate, responseEndDate } = this.getRnpTimePeriod(query);

    console.log(responseStartDate, responseEndDate, 'responseStartDate, responseEndDate');

    const sales = await this.#salesRepository.getSalesByDateRangeAndProduct(
      responseStartDate,
      responseEndDate,
      productId,
    );

    const orders = await this.#ordersRepository.getOrdersByDateRangeAndProduct(
      responseStartDate,
      responseEndDate,
      productId,
    );

    const stats = await this.#historyRepository.getHistoryByDateRangeAndProduct(
      responseStartDate,
      responseEndDate,
      productId,
    );

    const stockCount = await this.#stockCountRepository.getDailyStockByProduct(
      productId,
      responseStartDate,
      responseEndDate,
    );

    const advestStats = await this.#advestingDayStatisticRepository.getDailyAppStatsByProduct(
      responseStartDate,
      responseEndDate,
      productId,
    );

    return {
      sales,
      orders,
      stats,
      advestStats,
    };
  }
}
