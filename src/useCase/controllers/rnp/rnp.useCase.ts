import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { GetProductListQuery } from '@/shared/dtos/rnpAnalitics.dto';
import { parseJson } from '@/infrastructure/apps/scheduler/heplers/json.helper';

export class RnpUseCase {
  readonly #productRepository: ProductRepository;

  constructor(productRepository: ProductRepository) {
    this.#productRepository = productRepository;
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

  async getRnpAnalytics(query: any) {
    const { productId } = query;
  }
}
