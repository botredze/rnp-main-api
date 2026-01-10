import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { FinanceReportsRepository } from '@/infrastructure/core/typeOrm/repositories/financeReports.repository';
import { WeeklyFinanceReportRepository } from '@/infrastructure/core/typeOrm/repositories/weeklyFinanceReport.repository';
import {
  AvailableDatesResponse,
  DashboardMetric,
  DashboardResponse,
  DetailedReportItem,
  DetailedReportResponse,
  GetDashboardDto,
  GetDetailedReportDto,
  GetSummaryReportDto,
  SummaryReportResponse,
  UploadDetailedReportDto,
  UploadWeeklyReportDto,
} from '@/shared/dtos/financeReports.dto';
import { WbFinanceColumns, WbFinanceRow } from '@/shared/dtos/reports.dto';
import { mapWbRowToFinanceEntity, parseExcel, toNumber } from '@/shared/helpers/exel.parser';
import { parseWeeklyReportExcel, toDate, WeeklyReportColumns } from '@/shared/helpers/weeklyReport.parser';
import { BadRequestException } from '@nestjs/common';
import { eachWeekOfInterval, endOfMonth, endOfWeek, format, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UploadedReportsRepository } from '@/infrastructure/core/typeOrm/repositories/uploadedReports.repository';
import { calculateFileHash, createRecordKey } from '@/shared/helpers/fileHash.helper';

export class ReportsUseCase {
  readonly #productRepository: ProductRepository;
  readonly #financeRepository: FinanceReportsRepository;
  readonly #weeklyReportRepository: WeeklyFinanceReportRepository;
  readonly #uploadedReportRepository: UploadedReportsRepository;

  constructor(
    productRepository: ProductRepository,
    financeRepository: FinanceReportsRepository,
    weeklyReportRepository: WeeklyFinanceReportRepository,
    uploadedReportRepository: UploadedReportsRepository,
  ) {
    this.#productRepository = productRepository;
    this.#financeRepository = financeRepository;
    this.#weeklyReportRepository = weeklyReportRepository;
    this.#uploadedReportRepository = uploadedReportRepository;
  }

  /**
   * Загрузить еженедельный отчет с защитой от дубликатов
   */
  async uploadWeeklyReport(file: Express.Multer.File, dto: UploadWeeklyReportDto) {
    if (!file) {
      throw new BadRequestException('Excel file not provided');
    }

    const fileHash = calculateFileHash(file.buffer);
    const existingFile = await this.#uploadedReportRepository.fileExists({
      organizationId: dto.organizationId,
      fileHash,
      reportType: 'weekly',
    });

    if (existingFile) {
      throw new BadRequestException(
        `This file has already been uploaded on ${existingFile.uploadedAt.toLocaleDateString('ru-RU')}. ` +
          `It contained ${existingFile.recordsCount} records.`,
      );
    }

    const rows = parseWeeklyReportExcel(file.buffer);
    const savedReports = [];
    let duplicatesSkipped = 0;

    for (const row of rows) {
      const reportNumber = String(row[WeeklyReportColumns.REPORT_NUMBER]);

      const exists = await this.#weeklyReportRepository.reportExists({
        organizationId: dto.organizationId,
        reportNumber,
      });

      if (exists) {
        duplicatesSkipped++;
        continue;
      }

      const report = await this.#weeklyReportRepository.create({
        organizationId: dto.organizationId,
        reportNumber,
        legalEntity: String(row[WeeklyReportColumns.LEGAL_ENTITY]),
        startDate: toDate(row[WeeklyReportColumns.START_DATE]),
        endDate: toDate(row[WeeklyReportColumns.END_DATE]),
        formationDate: toDate(row[WeeklyReportColumns.FORMATION_DATE]),
        reportType: String(row[WeeklyReportColumns.REPORT_TYPE]),
        sales: toNumber(row[WeeklyReportColumns.SALES]),
        loyaltyCompensation: toNumber(row[WeeklyReportColumns.LOYALTY_COMPENSATION]),
        toTransfer: toNumber(row[WeeklyReportColumns.TO_TRANSFER]),
        agreedDiscount: toNumber(row[WeeklyReportColumns.AGREED_DISCOUNT]),
        logisticsCost: toNumber(row[WeeklyReportColumns.LOGISTICS_COST]),
        storageCost: toNumber(row[WeeklyReportColumns.STORAGE_COST]),
        acceptanceCost: toNumber(row[WeeklyReportColumns.ACCEPTANCE_COST]),
        otherCharges: toNumber(row[WeeklyReportColumns.OTHER_CHARGES]),
        totalFines: toNumber(row[WeeklyReportColumns.TOTAL_FINES]),
        vvCorrection: toNumber(row[WeeklyReportColumns.VV_CORRECTION]),
        loyaltyProgramCost: toNumber(row[WeeklyReportColumns.LOYALTY_PROGRAM_COST]),
        loyaltyPointsDeduction: toNumber(row[WeeklyReportColumns.LOYALTY_POINTS_DEDUCTION]),
        paymentTermChange: toNumber(row[WeeklyReportColumns.PAYMENT_TERM_CHANGE]),
        totalToPay: toNumber(row[WeeklyReportColumns.TOTAL_TO_PAY]),
        currency: String(row[WeeklyReportColumns.CURRENCY]),
      });

      savedReports.push(report);
    }

    await this.#uploadedReportRepository.create({
      organizationId: dto.organizationId,
      fileHash,
      fileName: file.originalname,
      reportType: 'weekly',
      recordsCount: savedReports.length,
      duplicatesSkipped,
    });

    return {
      success: true,
      message: `Loaded ${savedReports.length} weekly reports${duplicatesSkipped > 0 ? `, ${duplicatesSkipped} duplicates skipped` : ''}`,
      count: savedReports.length,
      duplicatesSkipped,
      totalProcessed: rows.length,
    };
  }

  /**
   * Загрузить детализированный отчет с защитой от дубликатов
   */
  async uploadDetailedReport(file: Express.Multer.File, dto: UploadDetailedReportDto) {
    if (!file) {
      throw new BadRequestException('Excel file not provided');
    }

    const fileHash = calculateFileHash(file.buffer);
    const existingFile = await this.#uploadedReportRepository.fileExists({
      organizationId: dto.organizationId,
      fileHash,
      reportType: 'detailed',
    });

    if (existingFile) {
      throw new BadRequestException(
        `This file has already been uploaded on ${existingFile.uploadedAt.toLocaleDateString('ru-RU')}. ` +
          `It contained ${existingFile.recordsCount} records.`,
      );
    }

    const rows = parseExcel<WbFinanceRow>(file.buffer);

    const recordsToCreate: Array<{
      entity: any;
      key: string;
    }> = [];

    for (const row of rows) {
      const product = await this.#productRepository.findOne({
        where: { nmID: toNumber(row[WbFinanceColumns.NOMENCLATURE_CODE]) },
      });

      if (!product) continue;

      const entity = mapWbRowToFinanceEntity(row, product.id);
      const key = createRecordKey({
        productId: entity.productId,
        saleDate: entity.saleDate,
        srid: entity.srid,
        documentType: entity.documentType,
      });

      recordsToCreate.push({ entity, key });
    }

    const existingKeys = await this.#financeRepository.checkBatchExists(
      recordsToCreate.map((r) => ({
        productId: r.entity.productId,
        saleDate: r.entity.saleDate,
        srid: r.entity.srid,
        documentType: r.entity.documentType,
      })),
    );

    const newRecords = recordsToCreate.filter((record) => !existingKeys.has(record.key));

    const result: Array<any> = [];
    let duplicatesSkipped = recordsToCreate.length - newRecords.length;

    for (const record of newRecords) {
      try {
        const saved = await this.#financeRepository.create(record.entity);
        result.push(saved);
      } catch (error) {
        if (error.code === '23505' || error.message.includes('duplicate')) {
          duplicatesSkipped++;
        } else {
          throw error;
        }
      }
    }

    await this.#uploadedReportRepository.create({
      organizationId: dto.organizationId,
      fileHash,
      fileName: file.originalname,
      reportType: 'detailed',
      recordsCount: result.length,
      duplicatesSkipped,
    });

    return {
      success: true,
      message: `Loaded ${result.length} new detailed finance records${duplicatesSkipped > 0 ? `, ${duplicatesSkipped} duplicates skipped` : ''}`,
      count: result.length,
      duplicatesSkipped,
      totalProcessed: rows.length,
    };
  }

  /**
   * Получить доступные даты отчетов
   */
  async getAvailableDates(organizationId: number): Promise<AvailableDatesResponse> {
    const dateRange = await this.#financeRepository.getDateRange(organizationId);

    if (!dateRange) {
      return {
        minDate: null,
        maxDate: null,
        availableMonths: [],
      };
    }

    const months: Array<string> = [];
    let currentDate = startOfMonth(dateRange.minDate);
    const endDate = endOfMonth(dateRange.maxDate);

    while (currentDate <= endDate) {
      months.push(format(currentDate, 'yyyy-MM'));
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    return {
      minDate: format(dateRange.minDate, 'yyyy-MM-dd'),
      maxDate: format(dateRange.maxDate, 'yyyy-MM-dd'),
      availableMonths: months,
    };
  }

  async getOrganizationDashboard(dto: GetDashboardDto): Promise<DashboardResponse> {
    const { organizationId, startDate, endDate } = dto;

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const weeklyMetrics = await this.#weeklyReportRepository.getDashboardMetrics({
      organizationId,
      startDate: start,
      endDate: end,
    });

    const detailedStats = await this.#financeRepository.getDetailedSalesStats({
      organizationId,
      startDate: start,
      endDate: end,
    });

    const costPriceData = await this.#financeRepository.getCostPriceForPeriod({
      organizationId,
      startDate: start,
      endDate: end,
    });

    const revenue = detailedStats.totalRevenue;
    const wbCommission = weeklyMetrics.totalSales - weeklyMetrics.totalToPay - weeklyMetrics.totalLogistics;
    const wbDeductions =
      wbCommission + weeklyMetrics.totalLogistics + weeklyMetrics.totalStorage + weeklyMetrics.totalFines;
    const netProfit = revenue - wbDeductions - costPriceData.totalCostPrice;
    const marginality = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const totalCosts = wbDeductions + costPriceData.totalCostPrice;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;

    const metrics: DashboardMetric[] = [
      {
        title: 'Чистая прибыль',
        value: `${Math.round(netProfit).toLocaleString('ru-RU')} сом`,
        subtitle: `Маржа: ${marginality.toFixed(1)}%`,
        change: null,
        isNegative: netProfit < 0,
      },
      {
        title: 'Выручка',
        value: `${Math.round(revenue).toLocaleString('ru-RU')} сом`,
        subtitle: `${detailedStats.totalSalesCount} продаж`,
        badge: `${detailedStats.totalReturnsCount} возвр.`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Продано на WB',
        value: `${Math.round(weeklyMetrics.totalSales).toLocaleString('ru-RU')} сом`,
        subtitle: 'По розничной цене',
        change: null,
        isNegative: false,
      },
      {
        title: 'Удержания WB',
        value: `${Math.round(wbDeductions).toLocaleString('ru-RU')} сом`,
        subtitle: 'Все расходы на площадке',
        change: null,
        isNegative: true,
      },
      {
        title: 'Комиссия WB',
        value: `${Math.round(wbCommission).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((wbCommission / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Логистика',
        value: `${Math.round(weeklyMetrics.totalLogistics).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((weeklyMetrics.totalLogistics / revenue) * 100).toFixed(1) : 0}% от выручки`,
        badge: `${detailedStats.totalDeliveries} доставок`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Прочие расходы',
        value: `${Math.round(weeklyMetrics.totalStorage + weeklyMetrics.totalFines).toLocaleString('ru-RU')} сом`,
        subtitle: 'Штрафы, хранение, реклама',
        change: null,
        isNegative: true,
      },
      {
        title: 'Бизнес-расходы',
        value: '0 сом',
        subtitle: 'Внесённые вручную',
        change: null,
        isNegative: false,
      },
      {
        title: 'Себестоимость',
        value: `${Math.round(costPriceData.totalCostPrice).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((costPriceData.totalCostPrice / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Налог',
        value: '0 сом',
        subtitle: '2%',
        change: null,
        isNegative: false,
      },
      {
        title: 'Маржинальность',
        value: `${marginality.toFixed(1)}%`,
        subtitle: 'Чистая прибыль / Выручка',
        change: null,
        isNegative: marginality < 0,
      },
      {
        title: 'Рентабельность',
        value: `${roi.toFixed(1)}%`,
        subtitle: 'ROI (прибыль / затраты)',
        change: null,
        isNegative: roi < 0,
      },
    ];

    return {
      metrics,
      dateRange: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      },
    };
  }

  async getOrganizationSummaryReport(dto: GetSummaryReportDto): Promise<SummaryReportResponse> {
    const { organizationId, startDate, endDate } = dto;

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((weekStart) => ({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 1 }),
    }));

    const weeklySummaries = await this.#weeklyReportRepository.getWeeklySummaries({
      organizationId,
      startDate: start,
      endDate: end,
    });

    const weeklyDetails = await this.#financeRepository.getWeeklyDetailedStats({
      organizationId,
      weeks,
    });

    const weeklyCosts = await this.#financeRepository.getWeeklyCostPrice({
      organizationId,
      weeks,
    });

    const summariesMap = new Map();
    weeklySummaries.forEach((summary) => {
      const key = format(new Date(summary.weekStart), 'yyyy-MM-dd');
      summariesMap.set(key, summary);
    });

    const detailsMap = new Map();
    weeklyDetails.forEach((detail) => {
      const key = format(new Date(detail.weekStart), 'yyyy-MM-dd');
      detailsMap.set(key, detail);
    });

    const costsMap = new Map();
    weeklyCosts.forEach((cost) => {
      const key = format(new Date(cost.weekStart), 'yyyy-MM-dd');
      costsMap.set(key, cost);
    });

    const months = weeks.map((week) => ({
      label: format(week.start, 'LLLL', { locale: ru }),
      startDate: format(week.start, 'd-MMM-yyyy', { locale: ru }),
      endDate: format(week.end, 'd-MMM-yyyy', { locale: ru }),
    }));

    const salesData = weeks.map((week) => {
      const key = format(week.start, 'yyyy-MM-dd');
      const detail = detailsMap.get(key);

      return {
        sales: detail?.salesCount || 0,
        returns: detail?.returnsCount || 0,
        deliveries: detail?.deliveries || 0,
        returnQty: detail?.returnQty || 0,
      };
    });

    const avgData = weeks.map((week) => {
      const key = format(week.start, 'yyyy-MM-dd');
      const detail = detailsMap.get(key);
      const cost = costsMap.get(key);

      if (!detail) {
        return {
          price: 0,
          commission: 0,
          transfer: 0,
          delivery: 0,
          cost: 0,
          margin: 0,
        };
      }

      return {
        price: Math.round(detail.avgPrice),
        commission: Math.round(detail.avgCommission),
        transfer: Math.round(detail.avgPrice - detail.avgCommission),
        delivery: detail.salesCount > 0 ? Math.round(detail.totalDeliveryCost / detail.salesCount) : 0,
        cost: Math.round(cost?.avgCost || 0),
        margin: Math.round(
          detail.avgPrice - detail.avgCommission - detail.totalDeliveryCost / (detail.salesCount || 1),
        ),
      };
    });

    const financeData = weeks.map((week) => {
      const key = format(week.start, 'yyyy-MM-dd');
      const summary = summariesMap.get(key);
      const detail = detailsMap.get(key);
      const cost = costsMap.get(key);

      if (!summary && !detail) {
        return {
          revenue: 0,
          commission: 0,
          commissionPct: '-',
          transfer: 0,
          deliveryCost: 0,
          fines: 0,
          acceptance: 0,
          deductions: 0,
          storage: 0,
          totalPay: 0,
          cost: 0,
          profit: 0,
        };
      }

      const revenue = detail?.totalRevenue || 0;
      const totalSales = summary?.totalSales || 0;
      const totalToPay = summary?.totalToPay || 0;
      const totalLogistics = summary?.totalLogistics || 0;
      const wbCommission = totalSales - totalToPay - totalLogistics;
      const totalCost = cost?.totalCost || 0;

      return {
        revenue: Math.round(revenue),
        commission: Math.round(wbCommission),
        commissionPct: revenue > 0 ? `${((wbCommission / revenue) * 100).toFixed(1)}%` : '-',
        transfer: Math.round(totalToPay),
        deliveryCost: Math.round(totalLogistics),
        fines: Math.round(summary?.totalFines || 0),
        acceptance: Math.round(summary?.totalAcceptanceCost || 0),
        deductions: 0,
        storage: Math.round(summary?.totalStorage || 0),
        totalPay: Math.round(totalToPay),
        cost: Math.round(totalCost),
        profit: Math.round(totalToPay - totalCost),
      };
    });

    const corrections = weeks.map(() => ({
      acquiring: '',
      replacedGoods: '',
      lostGoods: '',
      defect: '',
      salesCorrection: '',
      logisticsCorrection: '',
      advancePayment: '',
    }));

    return {
      months,
      salesData,
      avgData,
      financeData,
      corrections,
    };
  }

  /**
   * Получить детализированный отчет
   */
  async getDetailedReport(dto: GetDetailedReportDto): Promise<DetailedReportResponse> {
    const {
      organizationId,
      startDate,
      endDate,
      size,
      documentType,
      warehouse,
      searchQuery,
      page = 1,
      limit = 50,
    } = dto;

    const filters = {
      organizationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      size,
      documentType,
      warehouse,
      searchQuery,
    };

    const { data, total } = await this.#financeRepository.getDetailedReport({
      filters,
      page,
      limit,
    });

    // Получаем суммарную статистику
    const summary = await this.#financeRepository.getDetailedReportSummary(filters);

    // Форматируем данные
    const formattedData: DetailedReportItem[] = data.map((item) => ({
      id: item.id,
      documentType: item.documentType,
      size: item.size,
      barcode: item.barcode,
      orderDate: item.orderDate ? format(new Date(item.orderDate), 'yyyy-MM-dd') : null,
      saleDate: item.saleDate ? format(new Date(item.saleDate), 'yyyy-MM-dd') : null,
      quantity: item.quantity,
      saleAmount: Number(item.retailPriceWithDiscount) * Number(item.quantity),
      commission: Number(item.wbRewardWithoutVat),
      priceWithDiscount: Number(item.retailPriceWithDiscount),
      sppDiscount: Number(item.sppDiscountPercent),
      kvvPercent: Number(item.kvvPercent),
      sellerPayout: Number(item.sellerPayout),
      warehouse: item.warehouse,
      vendorCode: item.product?.vendorCode,
      productTitle: item.product?.title,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages,
      summary,
    };
  }

  async getDetailedReportFilterOptions(organizationId: number) {
    return await this.#financeRepository.getFilterOptions(organizationId);
  }
}
