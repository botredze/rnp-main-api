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

    const result = await this.repository.query(
      `
    WITH orders_daily AS (
      SELECT 
        DATE_TRUNC('day', o.date) AS day,
        COUNT(o.id)::int AS order_count,
        SUM(o."totalPrice")::numeric AS total_amount
      FROM orders o
      WHERE o.product_id = $1
        AND o.date BETWEEN $2 AND $3
      GROUP BY DATE_TRUNC('day', o.date)
    ),
    sales_daily AS (
      SELECT 
        DATE_TRUNC('day', s.date) AS day,
        COUNT(s.id)::int AS sales_count
      FROM sales s
      WHERE s.product_id = $1
        AND s.date BETWEEN $2 AND $3
      GROUP BY DATE_TRUNC('day', s.date)
    )
    SELECT 
      o.day::date AS date,
      o.order_count,
      o.total_amount,
      COALESCE(s.sales_count, 0) AS sales_count,
      CASE 
        WHEN COALESCE(s.sales_count, 0) = 0 THEN 0
        ELSE ROUND((o.order_count::decimal / s.sales_count::decimal) * 100, 2)
      END AS buyout_percent
    FROM orders_daily o
    LEFT JOIN sales_daily s ON o.day = s.day
    ORDER BY o.day ASC;
    `,
      [productId, start, end],
    );

    return result;
  }
}
