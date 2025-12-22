import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { GetProductListQuery, GetRnpAnalyticsDto } from '@/shared/dtos/rnpAnalitics.dto';
import { parseJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';
import { RnpAction } from '@/useCase/controllers/rnp/actions/rnp.action';
import { AnalyticsRepository } from '@/infrastructure/core/typeOrm/repositories/analitycs.repository';
import { ProductStatuses } from '@/infrastructure/core/typeOrm/models/products.model';

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

    const products = await this.#productRepository.findMany({
      where: { organizationId, status: ProductStatuses.ACTIVE },
    });

    if (products.length === 0) {
      return [];
    }

    for (const product of products) {
      const metrics = await this.#analyticsRepository.getProductByIdMetric(product.id);

      product.metricsCalculated = metrics;
    }

    return products.map((product) => ({
      ...product,
      characteristics: parseJson(product.characteristics),
      sizes: parseJson(product.sizes),
      photos: parseJson(product.photos),

      metricsCalculated: product.metricsCalculated,
    }));
  }

  async getRnpAnalytics(query: GetRnpAnalyticsDto) {
    const { productId } = query;
    const { responseStartDate, responseEndDate } = this.#rnpActions.getRnpTimePeriod(query);

    const dailyAnalytics = await this.#analyticsRepository.getDailyAnalytics(
      responseStartDate,
      responseEndDate,
      productId,
    );

    return dailyAnalytics;
  }

  async getBasicAnalytics(query: GetProductListQuery) {
    console.log(query, ' query');
    const { organizationId } = query;

    if (organizationId === undefined) {
      throw new Error('Organization id is undefined. Please provide organization id in query params');
    }

    const organizationBasicMetrics = await this.#analyticsRepository.getBasicAnalytics(organizationId);

    return organizationBasicMetrics;
  }
}
