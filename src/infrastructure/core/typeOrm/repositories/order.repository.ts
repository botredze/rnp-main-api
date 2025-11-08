import { DateTime } from 'luxon';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { OrderModel } from '@/infrastructure/core/typeOrm/models/order.model';

export class OrderRepository extends TypeOrmRepository<OrderModel> {
  constructor(@InjectRepository(OrderModel) repository: Repository<OrderModel>) {
    super(repository);
  }

  async getOrdersByDateRangeAndProduct(startDate: string, endDate: string, productId: number) {
    const start = DateTime.fromISO(startDate).startOf('day').toJSDate();
    const end = DateTime.fromISO(endDate).endOf('day').toJSDate();

    const orders = await this.repository
      .createQueryBuilder('orders')
      .where('orders.product_id = :productId', { productId })
      .andWhere('orders.date BETWEEN :start AND :end', { start, end })
      .select([
        'orders.id',
        'orders.date',
        'orders.lastChangeDate',
        'orders.totalPrice',
        'orders.discountPercent',
        'orders.finishedPrice',
        'orders.priceWithDisc',
        'orders.isCancel',
        'orders.cancelDate',
        'orders.warehouseName',
        'orders.countryName',
        'orders.regionName',
        'orders.brand',
        'orders.category',
        'orders.subject',
        'orders.techSize',
        'orders.supplierArticle',
        'orders.barcode',
        'orders.sticker',
        'orders.gNumber',
        'orders.srid',
        'orders.createdAt',
        'orders.updatedAt',
      ])
      .orderBy('orders.date', 'ASC')
      .getMany();

    const aggregates = await this.repository
      .createQueryBuilder('orders')
      .select('COUNT(orders.id)', 'totalCount')
      .addSelect('SUM(orders.total_price)', 'totalAmount')
      .where('orders.product_id = :productId', { productId })
      .andWhere('orders.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ totalcount: string; totalamount: string }>();

    return {
      orders,
      totalCount: Number(aggregates?.totalcount ?? 0),
      totalAmount: Number(aggregates?.totalamount ?? 0),
    };
  }
}
