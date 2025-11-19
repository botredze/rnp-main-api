import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesModel } from '@/infrastructure/core/typeOrm/models/sales.model';
import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';

export class SalesRepository extends TypeOrmRepository<SalesModel> {
  constructor(@InjectRepository(SalesModel) repository: Repository<SalesModel>) {
    super(repository);
  }

  async getSalesByDateRangeAndProduct(startDate: string, endDate: string, productId: number) {
    const result = await this.repository.query(
      `
    WITH days AS (
      SELECT generate_series($1::date, $2::date, interval '1 day')::date AS date
    )
    SELECT 
      d.date,
      COALESCE(SUM(s.total_price), 0) AS total_amount,
      COALESCE(COUNT(s.id), 0) AS total_count
    FROM days d
    LEFT JOIN sales s
      ON s.product_id = $3
     AND s.date::date <= d.date
     AND s.date::date >= $1::date
    GROUP BY d.date
    ORDER BY d.date;
    `,
      [startDate, endDate, productId],
    );

    return result.map((r) => ({
      date: r.date,
      totalAmount: Number(r.total_amount),
      totalCount: Number(r.total_count),
    }));
  }
}
