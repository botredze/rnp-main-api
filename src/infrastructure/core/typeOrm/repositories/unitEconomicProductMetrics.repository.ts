import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class UnitEconomicProductMetricsRepository extends TypeOrmRepository<UnitEconomicProductMetricsModel> {
  constructor(
    @InjectRepository(UnitEconomicProductMetricsModel) repository: Repository<UnitEconomicProductMetricsModel>,
  ) {
    super(repository);
  }
}
