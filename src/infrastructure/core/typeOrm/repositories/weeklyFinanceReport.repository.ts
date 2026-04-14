import { TypeOrmRepository } from '@/infrastructure/core/typeOrm/repositories/typeOrm.repository';
import { WeeklyFinanceReportModel } from '@/infrastructure/core/typeOrm/models/weeklyFinanceReport.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface DashboardMetrics {
  totalSales: number;
  totalLogistics: number;
  totalStorage: number;
  totalFines: number;
  totalToPay: number;
  totalOtherCharges: number;
  totalAcceptanceCost: number;
  totalVvCorrection: number;
  avgAgreedDiscount: number;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalSales: number;
  totalLogistics: number;
  totalStorage: number;
  totalFines: number;
  totalToPay: number;
  totalAcceptanceCost: number;
  otherCharges: number;
}

export class WeeklyFinanceReportRepository extends TypeOrmRepository<WeeklyFinanceReportModel> {
  constructor(@InjectRepository(WeeklyFinanceReportModel) repository: Repository<WeeklyFinanceReportModel>) {
    super(repository);
  }

  async getDashboardMetrics(params: {
    organizationId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<DashboardMetrics> {
    const { organizationId, startDate, endDate } = params;

    const result = await this.repository
      .createQueryBuilder('report')
      .select([
        'COALESCE(SUM(report.sales), 0) as "totalSales"',
        'COALESCE(SUM(report.logisticsCost), 0) as "totalLogistics"',
        'COALESCE(SUM(report.storageCost), 0) as "totalStorage"',
        'COALESCE(SUM(report.totalFines), 0) as "totalFines"',
        'COALESCE(SUM(report.totalToPay), 0) as "totalToPay"',
        'COALESCE(SUM(report.otherCharges), 0) as "totalOtherCharges"',
        'COALESCE(SUM(report.acceptanceCost), 0) as "totalAcceptanceCost"',
        'COALESCE(SUM(report.vvCorrection), 0) as "totalVvCorrection"',
        'COALESCE(AVG(report.agreedDiscount), 0) as "avgAgreedDiscount"',
      ])
      .where('report.organizationId = :organizationId', { organizationId })
      .andWhere('report.startDate >= :startDate', { startDate })
      .andWhere('report.endDate <= :endDate', { endDate })
      .getRawOne();

    return {
      totalSales: Number(result.totalSales),
      totalLogistics: Number(result.totalLogistics),
      totalStorage: Number(result.totalStorage),
      totalFines: Number(result.totalFines),
      totalToPay: Number(result.totalToPay),
      totalOtherCharges: Number(result.totalOtherCharges),
      totalAcceptanceCost: Number(result.totalAcceptanceCost),
      totalVvCorrection: Number(result.totalVvCorrection),
      avgAgreedDiscount: Number(result.avgAgreedDiscount),
    };
  }

  async getWeeklySummaries(params: {
    organizationId: number;
    startDate: Date;
    endDate: Date;
  }): Promise<WeeklySummary[]> {
    const { organizationId, startDate, endDate } = params;

    const results = await this.repository
      .createQueryBuilder('report')
      .select([
        'report.startDate as "weekStart"',
        'report.endDate as "weekEnd"',
        'COALESCE(SUM(report.sales), 0) as "totalSales"',
        'COALESCE(SUM(report.logisticsCost), 0) as "totalLogistics"',
        'COALESCE(SUM(report.storageCost), 0) as "totalStorage"',
        'COALESCE(SUM(report.totalFines), 0) as "totalFines"',
        'COALESCE(SUM(report.totalToPay), 0) as "totalToPay"',
        'COALESCE(SUM(report.acceptanceCost), 0) as "totalAcceptanceCost"',
        'COALESCE(SUM(report.otherCharges), 0) as "otherCharges"',
      ])
      .where('report.organizationId = :organizationId', { organizationId })
      .andWhere('report.startDate >= :startDate', { startDate })
      .andWhere('report.endDate <= :endDate', { endDate })
      .groupBy('report.startDate')
      .addGroupBy('report.endDate')
      .orderBy('report.startDate', 'ASC')
      .getRawMany();

    return results.map((r) => ({
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      totalSales: Number(r.totalSales),
      totalLogistics: Number(r.totalLogistics),
      totalStorage: Number(r.totalStorage),
      totalFines: Number(r.totalFines),
      totalToPay: Number(r.totalToPay),
      totalAcceptanceCost: Number(r.totalAcceptanceCost),
      otherCharges: Number(r.otherCharges),
    }));
  }

  async reportExists(params: { organizationId: number; reportNumber: string }): Promise<boolean> {
    const { organizationId, reportNumber } = params;

    return await this.exist({
      organizationId,
      reportNumber,
    });
  }
}
