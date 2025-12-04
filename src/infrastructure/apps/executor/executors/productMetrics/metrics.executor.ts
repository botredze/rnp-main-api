import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { ProductMetricsRepository } from '@/infrastructure/core/typeOrm/repositories/productMetrics.repository';
import { ProductLogAndStrategyModel } from '@/infrastructure/core/typeOrm/models/productLogAndStrategy.model';

export class MetricsExecutor extends TaskExecutor {
  readonly #productRepository: ProductRepository;
  readonly #metricsRepository: ProductMetricsRepository;

  constructor(productRepository: ProductRepository, metricsRepository: ProductMetricsRepository) {
    super();
    this.#productRepository = productRepository;
    this.#metricsRepository = metricsRepository;
  }

  async execute(): Promise<void> {
    const productList = await this.#productRepository.findMany({});

    for (const product of productList) {
      const payload = new ProductLogAndStrategyModel({
        // strategy: '',
        // log: '',
        // salePlan: 0,
        // date: new Date(),
        // productId: product.id,
      });

      await this.#metricsRepository.create(payload);
    }
  }
}
