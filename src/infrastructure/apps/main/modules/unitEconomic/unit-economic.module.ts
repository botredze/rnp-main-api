import { Module } from '@nestjs/common';
import { UnitEconomicController } from '@/infrastructure/apps/main/modules/unitEconomic/unit-economic.controller';

@Module({
  imports: [],
  controllers: [UnitEconomicController],
  providers: [],
})
export class UnitEconomicModule {}
