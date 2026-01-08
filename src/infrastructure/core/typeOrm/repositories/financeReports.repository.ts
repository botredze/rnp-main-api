import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface DetailedSalesStats {
  totalSalesCount: number;
  totalReturnsCount: number;
  totalDeliveries: number;
  totalReturnQty: number;
  totalRevenue: number;
  totalDeliveryCost: number;
  avgRetailPrice: number;
  avgCommission: number;
}

export interface WeeklyDetailedStats {
  weekStart: Date;
  weekEnd: Date;
  salesCount: number;
  returnsCount: number;
  deliveries: number;
  returnQty: number;
  avgPrice: number;
  avgCommission: number;
  totalRevenue: number;
  totalDeliveryCost: number;
}

export interface DetailedReportFilters {
  organizationId: number;
  startDate?: Date;
  endDate?: Date;
  size?: string;
  documentType?: string;
  warehouse?: string;
  searchQuery?: string;
}

export class FinanceReportsRepository extends TypeOrmRepository<FinanceReportsModel> {
  constructor(@InjectRepository(FinanceReportsModel) repository: Repository<FinanceReportsModel>) {
    super(repository);
  }

  /**
   * Получить агрегированные данные по продажам за период
   */
  async getDetailedSalesStats(params: {
    organizationId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<DetailedSalesStats> {
    const { organizationId, startDate, endDate } = params;

    const result = await this.repository
      .createQueryBuilder('report')
      .leftJoin('report.product', 'product')
      .select([
        'COUNT(CASE WHEN report.documentType = \'Продажа\' THEN 1 END) as "totalSalesCount"',
        'COUNT(CASE WHEN report.documentType = \'Возврат\' THEN 1 END) as "totalReturnsCount"',
        'COALESCE(SUM(report.deliveryCount), 0) as "totalDeliveries"',
        'COALESCE(SUM(report.returnCount), 0) as "totalReturnQty"',
        'COALESCE(SUM(report.retailPriceWithDiscount * report.quantity), 0) as "totalRevenue"',
        'COALESCE(SUM(report.deliveryServicesCost), 0) as "totalDeliveryCost"',
        'COALESCE(AVG(report.retailPrice), 0) as "avgRetailPrice"',
        'COALESCE(AVG(report.wbRewardWithoutVat), 0) as "avgCommission"',
      ])
      .where('product.organizationId = :organizationId', { organizationId })
      .andWhere('report.saleDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return {
      totalSalesCount: Number(result.totalSalesCount),
      totalReturnsCount: Number(result.totalReturnsCount),
      totalDeliveries: Number(result.totalDeliveries),
      totalReturnQty: Number(result.totalReturnQty),
      totalRevenue: Number(result.totalRevenue),
      totalDeliveryCost: Number(result.totalDeliveryCost),
      avgRetailPrice: Number(result.avgRetailPrice),
      avgCommission: Number(result.avgCommission),
    };
  }

  /**
   * Получить недельную статистику по детализированным отчетам
   */
  async getWeeklyDetailedStats(params: {
    organizationId: number;
    weeks: Array<{ start: Date; end: Date }>;
  }): Promise<WeeklyDetailedStats[]> {
    const { organizationId, weeks } = params;

    // Создаем UNION запрос для каждой недели
    const queries = weeks.map((week, index) => {
      return `
        SELECT 
          '${week.start.toISOString()}'::timestamp as "weekStart",
          '${week.end.toISOString()}'::timestamp as "weekEnd",
          COUNT(CASE WHEN report.document_type = 'Продажа' THEN 1 END) as "salesCount",
          COUNT(CASE WHEN report.document_type = 'Возврат' THEN 1 END) as "returnsCount",
          COALESCE(SUM(report.delivery_count), 0) as deliveries,
          COALESCE(SUM(report.return_count), 0) as "returnQty",
          COALESCE(AVG(report.retail_price), 0) as "avgPrice",
          COALESCE(AVG(report.wb_reward_without_vat), 0) as "avgCommission",
          COALESCE(SUM(report.retail_price_with_discount * report.quantity), 0) as "totalRevenue",
          COALESCE(SUM(report.delivery_services_cost), 0) as "totalDeliveryCost"
        FROM finance_reports report
        LEFT JOIN products product ON report.product_id = product.id
        WHERE product.organization_id = ${organizationId}
          AND report.sale_date BETWEEN '${week.start.toISOString()}' AND '${week.end.toISOString()}'
      `;
    });

    const unionQuery = queries.join(' UNION ALL ');
    const results = await this.repository.query(unionQuery);

    return results.map((r: any) => ({
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      salesCount: Number(r.salesCount),
      returnsCount: Number(r.returnsCount),
      deliveries: Number(r.deliveries),
      returnQty: Number(r.returnQty),
      avgPrice: Number(r.avgPrice),
      avgCommission: Number(r.avgCommission),
      totalRevenue: Number(r.totalRevenue),
      totalDeliveryCost: Number(r.totalDeliveryCost),
    }));
  }

  /**
   * Получить себестоимость продуктов за период с учетом размеров
   */
  async getCostPriceForPeriod(params: {
    organizationId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<{ totalCostPrice: number; avgCostPrice: number }> {
    const { organizationId, startDate, endDate } = params;

    const result = await this.repository.query(
      `
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN cost.size IS NOT NULL THEN cost.cost_price * report.quantity
            WHEN product_cost.cost_price IS NOT NULL THEN product_cost.cost_price * report.quantity
            ELSE 0
          END
        ), 0) as "totalCostPrice",
        COALESCE(AVG(
          CASE 
            WHEN cost.size IS NOT NULL THEN cost.cost_price
            WHEN product_cost.cost_price IS NOT NULL THEN product_cost.cost_price
            ELSE 0
          END
        ), 0) as "avgCostPrice"
      FROM finance_reports report
      LEFT JOIN products product ON report.product_id = product.id
      LEFT JOIN LATERAL (
        SELECT cost_price, fulfillment, size
        FROM product_cost_prices
        WHERE product_id = report.product_id
          AND size = report.size
          AND status = 'ACTIVE'
          AND date <= report.sale_date
        ORDER BY date DESC
        LIMIT 1
      ) cost ON true
      LEFT JOIN LATERAL (
        SELECT cost_price, fulfillment
        FROM product_cost_prices
        WHERE product_id = report.product_id
          AND application_type = 'PRODUCT'
          AND status = 'ACTIVE'
          AND date <= report.sale_date
        ORDER BY date DESC
        LIMIT 1
      ) product_cost ON cost.size IS NULL
      WHERE product.organization_id = $1
        AND report.sale_date BETWEEN $2 AND $3
    `,
      [organizationId, startDate, endDate],
    );

    return {
      totalCostPrice: Number(result[0]?.totalCostPrice || 0),
      avgCostPrice: Number(result[0]?.avgCostPrice || 0),
    };
  }

  /**
   * Получить недельную себестоимость
   */
  async getWeeklyCostPrice(params: {
    organizationId: number;
    weeks: Array<{ start: Date; end: Date }>;
  }): Promise<Array<{ weekStart: Date; weekEnd: Date; totalCost: number; avgCost: number }>> {
    const { organizationId, weeks } = params;

    const queries = weeks.map((week) => {
      return `
        SELECT 
          '${week.start.toISOString()}'::timestamp as "weekStart",
          '${week.end.toISOString()}'::timestamp as "weekEnd",
          COALESCE(SUM(
            CASE 
              WHEN cost.size IS NOT NULL THEN cost.cost_price * report.quantity
              WHEN product_cost.cost_price IS NOT NULL THEN product_cost.cost_price * report.quantity
              ELSE 0
            END
          ), 0) as "totalCost",
          COALESCE(AVG(
            CASE 
              WHEN cost.size IS NOT NULL THEN cost.cost_price
              WHEN product_cost.cost_price IS NOT NULL THEN product_cost.cost_price
              ELSE 0
            END
          ), 0) as "avgCost"
        FROM finance_reports report
        LEFT JOIN products product ON report.product_id = product.id
        LEFT JOIN LATERAL (
          SELECT cost_price, fulfillment, size
          FROM product_cost_prices
          WHERE product_id = report.product_id
            AND size = report.size
            AND status = 'ACTIVE'
            AND date <= report.sale_date
          ORDER BY date DESC
          LIMIT 1
        ) cost ON true
        LEFT JOIN LATERAL (
          SELECT cost_price, fulfillment
          FROM product_cost_prices
          WHERE product_id = report.product_id
            AND application_type = 'PRODUCT'
            AND status = 'ACTIVE'
            AND date <= report.sale_date
          ORDER BY date DESC
          LIMIT 1
        ) product_cost ON cost.size IS NULL
        WHERE product.organization_id = ${organizationId}
          AND report.sale_date BETWEEN '${week.start.toISOString()}' AND '${week.end.toISOString()}'
      `;
    });

    const unionQuery = queries.join(' UNION ALL ');
    const results = await this.repository.query(unionQuery);

    return results.map((r: any) => ({
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      totalCost: Number(r.totalCost),
      avgCost: Number(r.avgCost),
    }));
  }

  /**
   * Получить минимальную и максимальную даты отчетов
   */
  async getDateRange(organizationId: number): Promise<{ minDate: Date; maxDate: Date } | null> {
    const result = await this.repository
      .createQueryBuilder('report')
      .leftJoin('report.product', 'product')
      .select('MIN(report.saleDate)', 'minDate')
      .addSelect('MAX(report.saleDate)', 'maxDate')
      .where('product.organizationId = :organizationId', { organizationId })
      .getRawOne();

    if (!result || !result.minDate) return null;

    return {
      minDate: result.minDate,
      maxDate: result.maxDate,
    };
  }

  async recordExists(params: {
    productId: number;
    saleDate: Date;
    srid: string;
    documentType: string;
  }): Promise<boolean> {
    const { productId, saleDate, srid, documentType } = params;

    const count = await this.repository.count({
      where: {
        productId,
        saleDate,
        srid,
        documentType,
      },
    });

    return count > 0;
  }

  async checkBatchExists(
    records: Array<{
      productId: number;
      saleDate: Date;
      srid: string;
      documentType: string;
    }>,
  ): Promise<Set<string>> {
    if (records.length === 0) return new Set();

    const productIds = [...new Set(records.map((r) => r.productId))];

    const existingRecords = await this.repository
      .createQueryBuilder('report')
      .select(['report.productId', 'report.saleDate', 'report.srid', 'report.documentType'])
      .where('report.productId IN (:...productIds)', { productIds })
      .getMany();

    const existingKeys = new Set(
      existingRecords.map((r) => {
        const dateStr =
          r.saleDate instanceof Date
            ? r.saleDate.toISOString().split('T')[0]
            : new Date(r.saleDate).toISOString().split('T')[0];
        return `${r.productId}_${dateStr}_${r.srid}_${r.documentType}`;
      }),
    );

    return existingKeys;
  }

  /**
   * Массовое создание записей (игнорируя дубликаты)
   */
  async createBatchIgnoreDuplicates(
    records: Array<Partial<FinanceReportsModel>>,
  ): Promise<{ created: number; duplicates: number }> {
    if (records.length === 0) {
      return { created: 0, duplicates: 0 };
    }

    let created = 0;
    let duplicates = 0;

    await this.repository.manager.transaction(async (transactionalEntityManager) => {
      for (const record of records) {
        try {
          await transactionalEntityManager.save(FinanceReportsModel, record);
          created++;
        } catch (error) {
          if (error.code === '23505' || error.message.includes('duplicate')) {
            duplicates++;
          } else {
            throw error;
          }
        }
      }
    });

    return { created, duplicates };
  }

  async getDetailedReport(params: {
    filters: DetailedReportFilters;
    page: number;
    limit: number;
  }): Promise<{ data: any[]; total: number }> {
    const { filters, page, limit } = params;
    const skip = (page - 1) * limit;

    let query = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.product', 'product')
      .where('product.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      })
      .andWhere('report.documentType IS NOT NULL')
      .andWhere("report.documentType != ''");

    if (filters.startDate && filters.endDate) {
      query = query.andWhere('report.saleDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.size) {
      query = query.andWhere('report.size = :size', { size: filters.size });
    }

    if (filters.documentType) {
      query = query.andWhere('report.documentType = :documentType', {
        documentType: filters.documentType,
      });
    }

    if (filters.warehouse) {
      query = query.andWhere('report.warehouse = :warehouse', {
        warehouse: filters.warehouse,
      });
    }

    if (filters.searchQuery) {
      query = query.andWhere(
        '(report.barcode LIKE :search OR product.vendorCode LIKE :search OR product.title LIKE :search)',
        { search: `%${filters.searchQuery}%` },
      );
    }

    // Получаем общее количество
    const total = await query.getCount();

    // Получаем данные с пагинацией
    const data = await query
      .orderBy('report.saleDate', 'DESC')
      .addOrderBy('report.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return { data, total };
  }

  async getDetailedReportSummary(filters: DetailedReportFilters): Promise<{
    totalSales: number;
    totalReturns: number;
    totalRevenue: number;
    totalCommission: number;
    totalPayout: number;
  }> {
    let query = this.repository
      .createQueryBuilder('report')
      .leftJoin('report.product', 'product')
      .select([
        'COUNT(CASE WHEN report.documentType = \'Продажа\' THEN 1 END) as "totalSales"',
        'COUNT(CASE WHEN report.documentType = \'Возврат\' THEN 1 END) as "totalReturns"',
        'COALESCE(SUM(report.retailPriceWithDiscount * report.quantity), 0) as "totalRevenue"',
        'COALESCE(SUM(report.wbRewardWithoutVat), 0) as "totalCommission"',
        'COALESCE(SUM(report.sellerPayout), 0) as "totalPayout"',
      ])
      .where('product.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });

    // Применяем те же фильтры
    if (filters.startDate && filters.endDate) {
      query = query.andWhere('report.saleDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters.size) {
      query = query.andWhere('report.size = :size', { size: filters.size });
    }

    if (filters.documentType) {
      query = query.andWhere('report.documentType = :documentType', {
        documentType: filters.documentType,
      });
    }

    if (filters.warehouse) {
      query = query.andWhere('report.warehouse = :warehouse', {
        warehouse: filters.warehouse,
      });
    }

    if (filters.searchQuery) {
      query = query.andWhere(
        '(report.barcode LIKE :search OR product.vendorCode LIKE :search OR product.title LIKE :search)',
        { search: `%${filters.searchQuery}%` },
      );
    }

    const result = await query.getRawOne();

    return {
      totalSales: Number(result.totalSales),
      totalReturns: Number(result.totalReturns),
      totalRevenue: Number(result.totalRevenue),
      totalCommission: Number(result.totalCommission),
      totalPayout: Number(result.totalPayout),
    };
  }

  async getFilterOptions(organizationId: number): Promise<{
    sizes: string[];
    warehouses: string[];
  }> {
    const sizesResult = await this.repository
      .createQueryBuilder('report')
      .leftJoin('report.product', 'product')
      .select('DISTINCT report.size', 'size')
      .where('product.organizationId = :organizationId', { organizationId })
      .andWhere('report.size IS NOT NULL')
      .orderBy('report.size', 'ASC')
      .getRawMany();

    const warehousesResult = await this.repository
      .createQueryBuilder('report')
      .leftJoin('report.product', 'product')
      .select('DISTINCT report.warehouse', 'warehouse')
      .where('product.organizationId = :organizationId', { organizationId })
      .andWhere('report.warehouse IS NOT NULL')
      .orderBy('report.warehouse', 'ASC')
      .getRawMany();

    return {
      sizes: sizesResult.map((r) => r.size).filter(Boolean),
      warehouses: warehousesResult.map((r) => r.warehouse).filter(Boolean),
    };
  }
}
