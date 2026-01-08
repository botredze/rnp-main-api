import { ProductCostPriceRepository } from '@/infrastructure/core/typeOrm/repositories/productCostPrice.repository';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import {
  CreateProductCostDto,
  GetProductCostDto,
  ProductCostPriceResponse,
  ProductWithCostPricesResponse,
  UpdateProductCostDto,
} from '@/shared/dtos/productCost.dto';
import {
  OperationType,
  PriceApplicationType,
  ProductCostPriceModel,
  ProductCostPriceStatus,
} from '@/infrastructure/core/typeOrm/models/productCostPrice.model';
import { BadRequestException, NotFoundException } from '@nestjs/common';

export class CostPriceUseCase {
  readonly #productCostPriceRepository: ProductCostPriceRepository;
  readonly #productRepository: ProductRepository;

  constructor(productCostPriceRepository: ProductCostPriceRepository, productRepository: ProductRepository) {
    this.#productCostPriceRepository = productCostPriceRepository;
    this.#productRepository = productRepository;
  }

  async addProductCostPrice(dto: CreateProductCostDto): Promise<ProductCostPriceResponse> {
    const { productId, forWholeProduct, sizes, costPrice, fulfillment, date, operationType } = dto;

    const product = await this.#productRepository.findOneById(productId);
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    if (!forWholeProduct && (!sizes || sizes.length === 0)) {
      throw new BadRequestException('Either forWholeProduct must be true or sizes must be provided');
    }

    if (forWholeProduct && sizes && sizes.length > 0) {
      throw new BadRequestException('Cannot set both forWholeProduct and sizes');
    }

    const createdPrices: ProductCostPriceModel[] = [];

    if (forWholeProduct) {
      const price = await this.#productCostPriceRepository.createWithDeactivation({
        productId,
        costPrice,
        fulfillment,
        date: date ? new Date(date) : new Date(),
        operationType: operationType || OperationType.ONE_TIME,
        applicationType: PriceApplicationType.PRODUCT,
      });
      createdPrices.push(price);
    } else if (sizes && sizes.length > 0) {
      if (product.sizes && Array.isArray(product.sizes)) {
        const productSizes = product.sizes.map((s: any) => s.name || s);
        const invalidSizes = sizes.filter((size) => !productSizes.includes(size));
        if (invalidSizes.length > 0) {
          throw new BadRequestException(`Invalid sizes for this product: ${invalidSizes.join(', ')}`);
        }
      }

      const prices = await this.#productCostPriceRepository.createBulkForSizes({
        productId,
        sizes,
        costPrice,
        fulfillment,
        date: date ? new Date(date) : new Date(),
        operationType: operationType || OperationType.ONE_TIME,
      });
      createdPrices.push(...prices);
    }

    return {
      success: true,
      message: `Successfully created ${createdPrices.length} cost price record(s)`,
      data: createdPrices.map(this.#mapToResponse),
    };
  }

  async getProductCostPrice(dto: GetProductCostDto): Promise<ProductWithCostPricesResponse> {
    const { productId, date, includeHistory, includeInactive } = dto;

    const product = await this.#productRepository.findOne({
      where: { id: productId },
      relations: ['organization'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const queryDate = date ? new Date(date) : new Date();

    const productLevelPrice = await this.#productCostPriceRepository.getActivePrice({
      productId,
      date: queryDate,
      applicationType: PriceApplicationType.PRODUCT,
    });

    const sizePricesMap = await this.#productCostPriceRepository.getLatestPricesBySizes({
      productId,
      date: queryDate,
    });

    const sizePrices = Array.from(sizePricesMap.values());

    let history: Array<ProductCostPriceModel> = [];
    if (includeHistory) {
      history = await this.#productCostPriceRepository.getPriceHistory({
        productId,
        includeInactive: includeInactive || false,
      });
    }

    const stats = await this.#productCostPriceRepository.getPriceStats({ productId });

    return {
      product: {
        id: product.id!,
        nmID: product.nmID,
        sku: product.sku,
        vendorCode: product.vendorCode,
        brand: product.brand,
        title: product.title,
        sizes: product.sizes,
        organizationId: product.organizationId,
      },
      costPrices: {
        productLevel: productLevelPrice ? this.#mapToResponse(productLevelPrice) : null,
        bySize: sizePrices.map(this.#mapToResponse),
        history: includeHistory ? history.map(this.#mapToResponse) : undefined,
      },
      stats: {
        totalRecords: stats.totalRecords,
        activeRecords: stats.activeRecords,
        uniqueSizes: stats.uniqueSizes,
        hasProductLevelPrice: stats.hasProductLevelPrice,
        averageCostPrice: Number(stats.averageCostPrice.toFixed(2)),
        averageFulfillment: Number(stats.averageFulfillment.toFixed(2)),
      },
    };
  }

  async getEffectiveCostPrice(productId: number, size?: string, date?: Date) {
    const product = await this.#productRepository.findOneById(productId);
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const price = await this.#productCostPriceRepository.getEffectivePrice({
      productId,
      size,
      date: date || new Date(),
    });

    if (!price) {
      return {
        productId,
        size,
        hasPrice: false,
        message: 'No cost price found for this product/size',
      };
    }

    return {
      productId,
      size,
      hasPrice: true,
      price: this.#mapToResponse(price),
    };
  }

  async updateProductCostPrice(dto: UpdateProductCostDto): Promise<ProductCostPriceResponse> {
    const { id, costPrice, fulfillment, date, operationType, status } = dto;

    const existingPrice = await this.#productCostPriceRepository.findOneById(id);
    if (!existingPrice) {
      throw new NotFoundException(`Cost price record with id ${id} not found`);
    }

    const updateData: Partial<ProductCostPriceModel> = {};

    if (costPrice !== undefined) {
      updateData.costPrice = costPrice;
    }

    if (fulfillment !== undefined) {
      updateData.fulfillment = fulfillment;
    }

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (operationType !== undefined) {
      updateData.operationType = operationType;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updated = await this.#productCostPriceRepository.updateById(id, updateData);

    if (!updated) {
      throw new NotFoundException(`Failed to update cost price record with id ${id}`);
    }

    return {
      success: true,
      message: 'Cost price updated successfully',
      data: [this.#mapToResponse(updated)],
    };
  }

  async deactivateCostPrice(id: number): Promise<{ success: boolean; message: string }> {
    const existingPrice = await this.#productCostPriceRepository.findOneById(id);
    if (!existingPrice) {
      throw new NotFoundException(`Cost price record with id ${id} not found`);
    }

    await this.#productCostPriceRepository.updateById(id, {
      status: ProductCostPriceStatus.INACTIVE,
    });

    return {
      success: true,
      message: 'Cost price deactivated successfully',
    };
  }

  async deleteCostPrice(id: number): Promise<{ success: boolean; message: string }> {
    const existingPrice = await this.#productCostPriceRepository.findOneById(id);
    if (!existingPrice) {
      throw new NotFoundException(`Cost price record with id ${id} not found`);
    }

    await this.#productCostPriceRepository.updateById(id, {
      status: ProductCostPriceStatus.DELETED,
    });

    return {
      success: true,
      message: 'Cost price deleted successfully',
    };
  }

  async getProductsWithCostPrices(params: {
    organizationId: number;
    date?: Date;
    hasProductLevelPrice?: boolean;
    hasSizePrices?: boolean;
    skip?: number;
    take?: number;
  }) {
    const { organizationId, date, hasProductLevelPrice, hasSizePrices, skip = 0, take = 50 } = params;

    const products = await this.#productRepository.findMany({
      where: { organizationId },
      skip,
      take,
    });

    const result = [];

    for (const product of products) {
      const prices = await this.#productCostPriceRepository.getAllActivePrices({
        productId: product.id!,
        date: date || new Date(),
      });

      const productLevelPrice = prices.find((p) => p.applicationType === PriceApplicationType.PRODUCT);
      const sizePrices = prices.filter((p) => p.applicationType === PriceApplicationType.SIZE);

      if (hasProductLevelPrice !== undefined && !!productLevelPrice !== hasProductLevelPrice) {
        continue;
      }

      if (hasSizePrices !== undefined && sizePrices.length > 0 !== hasSizePrices) {
        continue;
      }

      result.push({
        product: {
          id: product.id!,
          nmID: product.nmID,
          sku: product.sku,
          vendorCode: product.vendorCode,
          title: product.title,
        },
        hasProductLevelPrice: !!productLevelPrice,
        sizePricesCount: sizePrices.length,
        productLevelPrice: productLevelPrice ? this.#mapToResponse(productLevelPrice) : null,
      });
    }

    return {
      data: result,
      total: result.length,
      skip,
      take,
    };
  }

  #mapToResponse(model: ProductCostPriceModel) {
    return {
      id: model.id,
      productId: model.productId,
      applicationType: model.applicationType,
      costPrice: Number(model.costPrice),
      fulfillment: Number(model.fulfillment),
      size: model.size,
      operationType: model.operationType,
      date: model.date,
      status: model.status,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
