import { Module } from '@nestjs/common';
import { ReportsController } from '@/infrastructure/apps/main/modules/reports/reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsUseCase } from '@/useCase/controllers/reports/reports.useCase';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { FinanceReportsRepository } from '@/infrastructure/core/typeOrm/repositories/financeReports.repository';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { FinanceReportReadyModel } from '@/infrastructure/core/typeOrm/models/financeReportReady.model';
import { WeeklyFinanceReportRepository } from '@/infrastructure/core/typeOrm/repositories/weeklyFinanceReport.repository';
import { WeeklyFinanceReportModel } from '@/infrastructure/core/typeOrm/models/weeklyFinanceReport.model';
import { UploadedReportsRepository } from '@/infrastructure/core/typeOrm/repositories/uploadedReports.repository';
import { UploadedReportModel } from '@/infrastructure/core/typeOrm/models/uploadedReports.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductsModel,
      FinanceReportsModel,
      FinanceReportReadyModel,
      WeeklyFinanceReportModel,
      UploadedReportModel,
    ]),
  ],
  controllers: [ReportsController],
  providers: [
    ProductRepository,
    FinanceReportsRepository,
    WeeklyFinanceReportRepository,
    UploadedReportsRepository,

    {
      provide: ReportsUseCase,
      useFactory: (
        productRepository: ProductRepository,
        financeRepository: FinanceReportsRepository,
        weeklyReportRepository: WeeklyFinanceReportRepository,
        uploadedReportsRepository: UploadedReportsRepository,
      ) => new ReportsUseCase(productRepository, financeRepository, weeklyReportRepository, uploadedReportsRepository),
      inject: [ProductRepository, FinanceReportsRepository, WeeklyFinanceReportRepository, UploadedReportsRepository],
    },
  ],
})
export class ReportsModule {}
