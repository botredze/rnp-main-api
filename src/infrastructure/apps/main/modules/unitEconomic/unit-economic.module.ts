import { Module } from '@nestjs/common';
import { UnitEconomicController } from '@/infrastructure/apps/main/modules/unitEconomic/unit-economic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';
import { UnitEconomicProductMetricsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProductMetrics.model';
import { UnitEconomicUseCase } from '@/useCase/controllers/unitEconomic/unitEconomic.useCases';
import { UnitEconomicProductRepository } from '@/infrastructure/core/typeOrm/repositories/unitEconomicProduct.repository';
import { UnitEconomicProductMetricsRepository } from '@/infrastructure/core/typeOrm/repositories/unitEconomicProductMetrics.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UnitEconomicProductsModel, UnitEconomicProductMetricsModel])],
  controllers: [UnitEconomicController],
  providers: [
    UnitEconomicProductMetricsRepository,
    UnitEconomicProductRepository,
    {
      provide: UnitEconomicUseCase,
      useFactory: (
        unitEconomicProductRepository: UnitEconomicProductRepository,
        unitEconomicProductMetricsRepository: UnitEconomicProductMetricsRepository,
      ) => new UnitEconomicUseCase(unitEconomicProductRepository, unitEconomicProductMetricsRepository),
      inject: [UnitEconomicProductRepository, UnitEconomicProductMetricsRepository],
    },
  ],
})
export class UnitEconomicModule {}
