import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import {
  OperationType,
  PriceApplicationType,
  ProductCostPriceModel,
  ProductCostPriceStatus,
} from '@/infrastructure/core/typeOrm/models/productCostPrice.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface CreateProductPriceParams {
  productId: number;
  costPrice: number;
  fulfillment: number;
  date: Date;
  operationType?: OperationType;
  applicationType: PriceApplicationType;
  size?: string;
}

export interface GetActivePriceParams {
  productId: number;
  size?: string;
  date?: Date;
  applicationType?: PriceApplicationType;
}

export class ProductCostPriceRepository extends TypeOrmRepository<ProductCostPriceModel> {
  constructor(@InjectRepository(ProductCostPriceModel) repository: Repository<ProductCostPriceModel>) {
    super(repository);
  }

  /**
   * Деактивировать цены по условиям
   */
  async deactivatePrices(params: {
    productId: number;
    size?: string | null;
    date?: Date;
    applicationType?: PriceApplicationType;
  }): Promise<number> {
    const { productId, size, date, applicationType } = params;

    const queryBuilder = this.repository
      .createQueryBuilder()
      .update(ProductCostPriceModel)
      .set({ status: ProductCostPriceStatus.INACTIVE })
      .where('productId = :productId', { productId })
      .andWhere('status = :status', { status: ProductCostPriceStatus.ACTIVE });

    if (date) {
      queryBuilder.andWhere('date = :date', { date });
    }

    if (size !== undefined) {
      if (size === null) {
        queryBuilder.andWhere('size IS NULL');
      } else {
        queryBuilder.andWhere('size = :size', { size });
      }
    }

    if (applicationType) {
      queryBuilder.andWhere('applicationType = :applicationType', { applicationType });
    }

    const result = await queryBuilder.execute();
    return result.affected ?? 0;
  }

  /**
   * Получить активную цену для продукта или размера
   */
  async getActivePrice(params: GetActivePriceParams): Promise<ProductCostPriceModel | null> {
    const { productId, size, date, applicationType } = params;
    const queryDate = date || new Date();

    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .where('price.productId = :productId', { productId })
      .andWhere('price.status = :status', { status: ProductCostPriceStatus.ACTIVE })
      .andWhere('price.date <= :date', { date: queryDate })
      .orderBy('price.date', 'DESC')
      .addOrderBy('price.id', 'DESC');

    if (size !== undefined) {
      queryBuilder.andWhere('price.size = :size', { size });
    }

    if (applicationType) {
      queryBuilder.andWhere('price.applicationType = :applicationType', { applicationType });
    }

    return await queryBuilder.getOne();
  }

  /**
   * Получить все активные цены для продукта
   */
  async getAllActivePrices(params: {
    productId: number;
    date?: Date;
    includeProductLevel?: boolean;
  }): Promise<ProductCostPriceModel[]> {
    const { productId, date, includeProductLevel = true } = params;
    const queryDate = date || new Date();

    console.log('getAllActivePrices called with:', { productId, queryDate, includeProductLevel });

    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .where('price.productId = :productId', { productId })
      .andWhere('price.status = :status', { status: ProductCostPriceStatus.ACTIVE })
      .andWhere('price.date <= :date', { date: queryDate });

    if (!includeProductLevel) {
      queryBuilder.andWhere('price.applicationType = :type', {
        type: PriceApplicationType.SIZE,
      });
    }

    const results = await queryBuilder
      .orderBy('price.applicationType', 'ASC')
      .addOrderBy('price.size', 'ASC')
      .addOrderBy('price.date', 'DESC')
      .getMany();

    console.log(`Found ${results.length} prices for product ${productId}`);
    return results;
  }

  /**
   * Получить эффективную цену с учетом иерархии (размер -> продукт)
   */
  async getEffectivePrice(params: {
    productId: number;
    size?: string;
    date?: Date;
  }): Promise<ProductCostPriceModel | null> {
    const { productId, size, date } = params;

    // Сначала пытаемся найти цену для конкретного размера
    if (size) {
      const sizePrice = await this.getActivePrice({
        productId,
        size,
        date,
        applicationType: PriceApplicationType.SIZE,
      });

      if (sizePrice) {
        return sizePrice;
      }
    }

    // Если не нашли или size не указан, возвращаем цену для всего продукта
    return await this.getActivePrice({
      productId,
      date,
      applicationType: PriceApplicationType.PRODUCT,
    });
  }

  /**
   * Создать цену с автоматической деактивацией предыдущих
   */
  async createWithDeactivation(params: CreateProductPriceParams): Promise<ProductCostPriceModel> {
    // Деактивируем старые цены
    await this.deactivatePrices({
      productId: params.productId,
      size: params.applicationType === PriceApplicationType.SIZE ? params.size : null,
      date: params.date,
      applicationType: params.applicationType,
    });

    // Создаем новую цену
    return await this.create({
      productId: params.productId,
      costPrice: params.costPrice,
      fulfillment: params.fulfillment,
      date: params.date,
      operationType: params.operationType || OperationType.ONE_TIME,
      applicationType: params.applicationType,
      size: params.applicationType === PriceApplicationType.SIZE ? params.size : null,
      status: ProductCostPriceStatus.ACTIVE,
    });
  }

  async createBulkForSizes(params: {
    productId: number;
    sizes: string[];
    costPrice: number;
    fulfillment: number;
    date: Date;
    operationType?: OperationType;
  }): Promise<ProductCostPriceModel[]> {
    const { productId, sizes, costPrice, fulfillment, date, operationType } = params;
    const results: ProductCostPriceModel[] = [];

    for (const size of sizes) {
      const price = await this.createWithDeactivation({
        productId,
        size,
        costPrice,
        fulfillment,
        date,
        operationType,
        applicationType: PriceApplicationType.SIZE,
      });
      results.push(price);
    }

    return results;
  }

  async getPriceHistory(params: {
    productId: number;
    size?: string;
    startDate?: Date;
    endDate?: Date;
    includeInactive?: boolean;
  }): Promise<ProductCostPriceModel[]> {
    const { productId, size, startDate, endDate, includeInactive = false } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .where('price.productId = :productId', { productId });

    if (!includeInactive) {
      queryBuilder.andWhere('price.status IN (:...statuses)', {
        statuses: [ProductCostPriceStatus.ACTIVE, ProductCostPriceStatus.INACTIVE],
      });
    }

    if (size !== undefined) {
      if (size === null) {
        queryBuilder.andWhere('price.size IS NULL');
      } else {
        queryBuilder.andWhere('price.size = :size', { size });
      }
    }

    if (startDate) {
      queryBuilder.andWhere('price.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('price.date <= :endDate', { endDate });
    }

    return await queryBuilder.orderBy('price.date', 'DESC').addOrderBy('price.createdAt', 'DESC').getMany();
  }

  async getLatestPricesBySizes(params: {
    productId: number;
    date?: Date;
  }): Promise<Map<string, ProductCostPriceModel>> {
    const { productId, date } = params;
    const queryDate = date || new Date();

    const prices = await this.repository
      .createQueryBuilder('price')
      .select()
      .where('price.productId = :productId', { productId })
      .andWhere('price.applicationType = :type', { type: PriceApplicationType.SIZE })
      .andWhere('price.status = :status', { status: ProductCostPriceStatus.ACTIVE })
      .andWhere('price.date <= :date', { date: queryDate })
      .orderBy('price.date', 'DESC')
      .addOrderBy('price.id', 'DESC')
      .getMany();

    // Группируем по размерам, оставляя только последнюю цену для каждого размера
    const priceMap = new Map<string, ProductCostPriceModel>();
    for (const price of prices) {
      if (price.size && !priceMap.has(price.size)) {
        priceMap.set(price.size, price);
      }
    }

    return priceMap;
  }

  async hasActivePrice(params: {
    productId: number;
    size?: string;
    applicationType?: PriceApplicationType;
  }): Promise<boolean> {
    const { productId, size, applicationType } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .select('1')
      .where('price.productId = :productId', { productId })
      .andWhere('price.status = :status', { status: ProductCostPriceStatus.ACTIVE });

    if (size !== undefined) {
      queryBuilder.andWhere('price.size = :size', { size });
    }

    if (applicationType) {
      queryBuilder.andWhere('price.applicationType = :applicationType', { applicationType });
    }

    const result = await queryBuilder.getRawOne();
    return !!result;
  }

  async cleanupOldPrices(params: { olderThanDays: number }): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - params.olderThanDays);

    const result = await this.repository
      .createQueryBuilder()
      .update(ProductCostPriceModel)
      .set({ status: ProductCostPriceStatus.DELETED })
      .where('status = :status', { status: ProductCostPriceStatus.INACTIVE })
      .andWhere('updatedAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected ?? 0;
  }

  async getPriceStats(params: { productId: number; startDate?: Date; endDate?: Date }): Promise<{
    totalRecords: number;
    activeRecords: number;
    inactiveRecords: number;
    uniqueSizes: number;
    hasProductLevelPrice: boolean;
    averageCostPrice: number;
    averageFulfillment: number;
  }> {
    const { productId, startDate, endDate } = params;

    const queryBuilder = this.repository
      .createQueryBuilder('price')
      .where('price.productId = :productId', { productId })
      .andWhere('price.status != :deletedStatus', { deletedStatus: ProductCostPriceStatus.DELETED });

    if (startDate) {
      queryBuilder.andWhere('price.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('price.date <= :endDate', { endDate });
    }

    const allPrices = await queryBuilder.getMany();

    const activeRecords = allPrices.filter((p) => p.status === ProductCostPriceStatus.ACTIVE).length;
    const inactiveRecords = allPrices.filter((p) => p.status === ProductCostPriceStatus.INACTIVE).length;
    const uniqueSizes = new Set(allPrices.filter((p) => p.size).map((p) => p.size)).size;
    const hasProductLevelPrice = allPrices.some((p) => p.applicationType === PriceApplicationType.PRODUCT);

    const totalCostPrice = allPrices.reduce((sum, p) => sum + Number(p.costPrice), 0);
    const totalFulfillment = allPrices.reduce((sum, p) => sum + Number(p.fulfillment), 0);

    return {
      totalRecords: allPrices.length,
      activeRecords,
      inactiveRecords,
      uniqueSizes,
      hasProductLevelPrice,
      averageCostPrice: allPrices.length > 0 ? totalCostPrice / allPrices.length : 0,
      averageFulfillment: allPrices.length > 0 ? totalFulfillment / allPrices.length : 0,
    };
  }
}
