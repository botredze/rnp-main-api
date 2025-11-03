import { UnitEconomicCreateDto, UnitEconomicGetQueryDto } from '@/shared/dtos/unitEconomic.dto';
import { UnitEconomicProductRepository } from '@/infrastructure/core/typeOrm/repositories/unitEconomicProduct.repository';
import { UnitEconomicProductMetricsRepository } from '@/infrastructure/core/typeOrm/repositories/unitEconomicProductMetrics.repository';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';

export class UnitEconomicController {
  readonly #unitEconomicProductRepository: UnitEconomicProductRepository;
  readonly #unitEconomicProductMetricsRepository: UnitEconomicProductMetricsRepository;

  constructor(
    unitEconomicProductRepository: UnitEconomicProductRepository,
    unitEconomicProductMetricsRepository: UnitEconomicProductMetricsRepository,
  ) {
    this.#unitEconomicProductRepository = unitEconomicProductRepository;
    this.#unitEconomicProductMetricsRepository = unitEconomicProductMetricsRepository;
  }

  async getList(query: UnitEconomicGetQueryDto): Promise<any> {
    const { organizationId } = query;

    const products = await this.#unitEconomicProductRepository.findMany({ where: { organizationId } });

    if (!products) {
      throw new Error('Products not found');
    }

    return products;
  }

  async getById(query: UnitEconomicGetQueryDto): Promise<any> {
    const { productId } = query;

    const product = await this.#unitEconomicProductRepository.findOne({
      where: { id: productId },
      relations: ['unit_economic_product_metrics'],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async create(query: UnitEconomicCreateDto): Promise<any> {
    const { organizationId, metrics } = query;

    const createPayload = new UnitEconomicProductsModel({
      productName: query.productName,
      vendorCode: query.vendorCode,
      price: query.price,
      salePrice: query.salePrice,
      ssp: query.ssp,
      priceWithSpp: query.priceWithSpp,
      priceWithWbDiscount: query.priceWithWbDiscount,
      organizationId,
    });
    const createdProduct = await this.#unitEconomicProductRepository.create(createPayload);

    const { id } = createdProduct;
    for (const item of metrics) {
      const createMetricsPayload = new UnitEconomicProductMetricsModel({
        label: item.label,
        percent: item.percent,
        value: item.value,
        percentOfPrice: item.percentOfPrice,
        isEditable: item.isEditable,
        unitEconomicProductId: id,
      });

      await this.#unitEconomicProductMetricsRepository.create(createMetricsPayload);
    }

    const list = await this.#unitEconomicProductRepository.findMany({ where: { organizationId } });

    return list;
  }

  async update(): Promise<any> {}

  async delete(): Promise<any> {}
}
