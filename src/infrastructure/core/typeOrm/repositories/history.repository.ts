import { DateTime } from 'luxon';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { HistoryModel } from '@/infrastructure/core/typeOrm/models/history.model';

export class HistoryRepository extends TypeOrmRepository<HistoryModel> {
  constructor(@InjectRepository(HistoryModel) repository: Repository<HistoryModel>) {
    super(repository);
  }

  async getHistoryByDateRangeAndProduct(startDate: string, endDate: string, productId: number) {
    const start = DateTime.fromISO(startDate).startOf('day').toJSDate();
    const end = DateTime.fromISO(endDate).endOf('day').toJSDate();

    const histories = await this.repository
      .createQueryBuilder('history')
      .where('history.product_id = :productId', { productId })
      .andWhere('history.date BETWEEN :start AND :end', { start, end })
      .orderBy('history.date', 'ASC')
      .getMany();

    const aggregates = await this.repository
      .createQueryBuilder('history')
      .select('SUM(history.open_card_count)', 'totalOpenCardCount')
      .addSelect('SUM(history.add_to_card_count)', 'totalAddToCardCount')
      .addSelect('SUM(history.orders_count)', 'totalOrdersCount')
      .addSelect('SUM(history.order_sum_rub)', 'totalOrderSumRub')
      .addSelect('SUM(history.buy_out_count)', 'totalBuyOutCount')
      .addSelect('SUM(history.buy_out_sum_rub)', 'totalBuyOutSumRub')
      .addSelect('AVG(history.buy_out_percent)', 'avgBuyOutPercent')
      .addSelect('AVG(history.add_to_card_conversion)', 'avgAddToCardConversion')
      .addSelect('AVG(history.card_to_order_conversion)', 'avgCardToOrderConversion')
      .addSelect('AVG(history.add_to_with_list)', 'avgAddToWishlist')
      .where('history.product_id = :productId', { productId })
      .andWhere('history.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{
        totalopencardcount: string;
        totaladdtocardcount: string;
        totalorderscount: string;
        totalordersumrub: string;
        totalbuyoutcount: string;
        totalbuyoutsumrub: string;
        avgbuyoutpercent: string;
        avgaddtocardconversion: string;
        avgcardtoorderconversion: string;
        avgaddtowishlist: string;
      }>();

    return {
      histories,
      stats: {
        totalOpenCardCount: Number(aggregates?.totalopencardcount ?? 0),
        totalAddToCardCount: Number(aggregates?.totaladdtocardcount ?? 0),
        totalOrdersCount: Number(aggregates?.totalorderscount ?? 0),
        totalOrderSumRub: Number(aggregates?.totalordersumrub ?? 0),
        totalBuyOutCount: Number(aggregates?.totalbuyoutcount ?? 0),
        totalBuyOutSumRub: Number(aggregates?.totalbuyoutsumrub ?? 0),
        avgBuyOutPercent: Number(aggregates?.avgbuyoutpercent ?? 0),
        avgAddToCardConversion: Number(aggregates?.avgaddtocardconversion ?? 0),
        avgCardToOrderConversion: Number(aggregates?.avgcardtoorderconversion ?? 0),
        avgAddToWishlist: Number(aggregates?.avgaddtowishlist ?? 0),
      },
    };
  }
}
