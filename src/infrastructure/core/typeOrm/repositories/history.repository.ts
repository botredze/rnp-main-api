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

    const dailyStats = await this.repository.query(
      `
    SELECT 
      DATE_TRUNC('day', h.date)::date AS date,
      SUM(h.open_card_count)::int AS open_card_count,
      SUM(h.add_to_card_count)::int AS add_to_card_count,
      SUM(h.orders_count)::int AS orders_count,
      SUM(h.order_sum_rub)::numeric AS order_sum_rub,
      SUM(h.buy_out_count)::int AS buy_out_count,
      SUM(h.buy_out_sum_rub)::numeric AS buy_out_sum_rub,
      ROUND(AVG(h.buy_out_percent)::numeric, 2) AS avg_buy_out_percent,
      ROUND(AVG(h.add_to_card_conversion)::numeric, 2) AS avg_add_to_card_conversion,
      ROUND(AVG(h.card_to_order_conversion)::numeric, 2) AS avg_card_to_order_conversion,
      ROUND(AVG(h.add_to_with_list)::numeric, 2) AS avg_add_to_wishlist
    FROM history h
    WHERE h.product_id = $1
      AND h.date BETWEEN $2 AND $3
    GROUP BY DATE_TRUNC('day', h.date)
    ORDER BY DATE_TRUNC('day', h.date);
    `,
      [productId, start, end],
    );

    const totals = await this.repository.query(
      `
    SELECT 
      SUM(h.open_card_count)::int AS total_open_card_count,
      SUM(h.add_to_card_count)::int AS total_add_to_card_count,
      SUM(h.orders_count)::int AS total_orders_count,
      SUM(h.order_sum_rub)::numeric AS total_order_sum_rub,
      SUM(h.buy_out_count)::int AS total_buy_out_count,
      SUM(h.buy_out_sum_rub)::numeric AS total_buy_out_sum_rub,
      ROUND(AVG(h.buy_out_percent)::numeric, 2) AS avg_buy_out_percent,
      ROUND(AVG(h.add_to_card_conversion)::numeric, 2) AS avg_add_to_card_conversion,
      ROUND(AVG(h.card_to_order_conversion)::numeric, 2) AS avg_card_to_order_conversion,
      ROUND(AVG(h.add_to_with_list)::numeric, 2) AS avg_add_to_wishlist
    FROM history h
    WHERE h.product_id = $1
      AND h.date BETWEEN $2 AND $3;
    `,
      [productId, start, end],
    );

    return {
      days: dailyStats,
      totals: totals[0] ?? {},
    };
  }
}
