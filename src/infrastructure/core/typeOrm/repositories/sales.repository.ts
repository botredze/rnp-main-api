import { DateTime } from 'luxon';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';

export class SalesRepository extends TypeOrmRepository<SalesModel> {
  constructor(@InjectRepository(SalesModel) repository: Repository<SalesModel>) {
    super(repository);
  }

  async getSalesByDateRangeAndProduct(startDate: string, endDate: string, productId: number) {
    const start = DateTime.fromISO(startDate).startOf('day').toJSDate();
    const end = DateTime.fromISO(endDate).endOf('day').toJSDate();

    const qb = this.repository
      .createQueryBuilder('sales')
      .where('sales.product_id = :productId', { productId })
      .andWhere('sales.date BETWEEN :start AND :end', { start, end })
      .select([
        'sales.id',
        'sales.date',
        'sales.nmId',
        'sales.totalPrice',
        'sales.discountPercent',
        'sales.forPay',
        'sales.paymentSaleAmount',
        'sales.finishedPrice',
        'sales.priceWithDisc',
        'sales.isCansel',
        'sales.cancelDate',
        'sales.saleID',
        'sales.warehouseName',
        'sales.countryName',
        'sales.regionName',
        'sales.supplierArticle',
        'sales.barcode',
        'sales.incomeId',
        'sales.spp',
        'sales.sticker',
        'sales.gNumber',
        'sales.srid',
        'sales.createdAt',
        'sales.updatedAt',
      ]);

    const sales = await qb.getMany();

    const aggregates = await this.repository
      .createQueryBuilder('sales')
      .select('COUNT(sales.id)', 'totalCount')
      .addSelect('SUM(sales.total_price)', 'totalAmount')
      .where('sales.product_id = :productId', { productId })
      .andWhere('sales.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ totalcount: string; totalamount: string }>();

    return {
      sales,
      totalCount: Number(aggregates?.totalcount ?? 0),
      totalAmount: Number(aggregates?.totalamount ?? 0),
    };
  }
}
