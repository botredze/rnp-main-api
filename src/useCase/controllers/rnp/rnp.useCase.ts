import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { GetProductListQuery, GetRnpAnalyticsDto } from '@/shared/dtos/rnpAnalitics.dto';
import { parseJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { RnpAction } from '@/useCase/controllers/rnp/actions/rnp.action';
import { AnalyticsRepository } from '@/infrastructure/core/typeOrm/repositories/analitycs.repository';

export class RnpUseCase {
  readonly #productRepository: ProductRepository;
  readonly #rnpActions: RnpAction;
  readonly #analyticsRepository: AnalyticsRepository;

  constructor(productRepository: ProductRepository, analyticsRepository: AnalyticsRepository) {
    this.#productRepository = productRepository;
    this.#analyticsRepository = analyticsRepository;
    this.#rnpActions = new RnpAction();
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

  async getRnpAnalytics(query: GetRnpAnalyticsDto) {
    const { productId } = query;
    const { responseStartDate, responseEndDate } = this.#rnpActions.getRnpTimePeriod(query);

    console.log(responseStartDate, responseEndDate, 'responseStartDate, responseEndDate ');
    const dailyAnalytics = await this.#analyticsRepository.getDailyAnalytics(
      responseStartDate,
      responseEndDate,
      productId,
    );

    return dailyAnalytics;
  }
}
