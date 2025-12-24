import { Module } from '@nestjs/common';
import { ReportsController } from '@/infrastructure/apps/main/modules/reports/reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsUseCase } from '@/useCase/controllers/reports/reports.useCase';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { FinanceReportsRepository } from '@/infrastructure/core/typeOrm/repositories/financeReports.repository';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { FinanceReportReadyModel } from '@/infrastructure/core/typeOrm/models/financeReportReady.model';

@Module({
  imports: [TypeOrmModule.forFeature([ProductsModel, FinanceReportsModel, FinanceReportReadyModel])],
  controllers: [ReportsController],
  providers: [
    ProductRepository,
    FinanceReportsRepository,
    {
      provide: ReportsUseCase,
      useFactory: (productRepository: ProductRepository, financeRepository: FinanceReportsRepository) =>
        new ReportsUseCase(productRepository, financeRepository),
      inject: [ProductRepository, FinanceReportsRepository],
    },
  ],
})
export class ReportsModule {}
