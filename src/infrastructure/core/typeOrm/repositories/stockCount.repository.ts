import { Repository } from 'typeorm';
import { DateTime } from 'luxon';
import { StockCountModel } from '@/infrastructure/core/typeOrm/models/stockCount.model';
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { InjectRepository } from '@nestjs/typeorm';

export class StockCountRepository extends TypeOrmRepository<StockCountModel> {
  constructor(@InjectRepository(StockCountModel) repository: Repository<StockCountModel>) {
    super(repository);
  }

  async getDailyStockByProduct(productId: number, startDate?: string, endDate?: string) {
    const qb = this.repository
      .createQueryBuilder('stock')
      .select('DATE(stock.date)', 'date') // группируем по дате
      .addSelect('SUM(stock.quantity_full)', 'totalQuantity') // суммируем остатки
      .where('stock.product_id = :productId', { productId });

    if (startDate && endDate) {
      const start = DateTime.fromISO(startDate).startOf('day').toJSDate();
      const end = DateTime.fromISO(endDate).endOf('day').toJSDate();
      qb.andWhere('stock.date BETWEEN :start AND :end', { start, end });
    }

    qb.groupBy('DATE(stock.date)').orderBy('DATE(stock.date)', 'ASC');

    const result = await qb.getRawMany<{ date: string; totalQuantity: string }>();

    return result.map((r) => ({
      date: r.date,
      totalQuantity: Number(r.totalQuantity),
    }));
  }
}
