import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { AdvertisingDayStatisticModel } from '@/infrastructure/core/typeOrm/models/advertisingDayStatistic.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class AdvestingDayStatisticRepository extends TypeOrmRepository<AdvertisingDayStatisticModel> {
  constructor(@InjectRepository(AdvertisingDayStatisticModel) repository: Repository<AdvertisingDayStatisticModel>) {
    super(repository);
  }

  async getDailyAppStatsByProduct(startDate: string, endDate: string, productId: number) {
    return this.repository
      .createQueryBuilder('day')
      .leftJoin('day.apps', 'app')
      .leftJoin('app.nms', 'nm') // подключаем NM, чтобы фильтровать по productId
      .select([
        'day.date AS date',
        'app.appType AS appType',
        'SUM(nm.sum_price) AS spend', // теперь суммируем только по NM
        'SUM(nm.views) AS views',
        'SUM(nm.clicks) AS clicks',
        'CASE WHEN SUM(nm.clicks) = 0 THEN 0 ELSE SUM(nm.sum_price)/SUM(nm.clicks) END AS cpc',
        'CASE WHEN SUM(nm.views) = 0 THEN 0 ELSE SUM(nm.clicks)*100.0/SUM(nm.views) END AS ctr',
        'SUM(nm.atbs) AS atbs',
        'SUM(nm.orders) AS orders',
        'CASE WHEN SUM(nm.orders) = 0 THEN 0 ELSE SUM(nm.sum_price)/SUM(nm.orders) END AS cpo',
      ])
      .where('day.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('nm.productId = :productId', { productId })
      .groupBy('day.date')
      .addGroupBy('app.appType')
      .orderBy('day.date', 'ASC')
      .addOrderBy('app.appType', 'ASC')
      .getRawMany();
  }
}
