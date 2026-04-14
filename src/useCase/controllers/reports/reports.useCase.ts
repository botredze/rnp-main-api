import { Logger } from '@nestjs/common';
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
import { getExcelColumnNames, mapWbRowToFinanceEntity, parseExcel, toNumber } from '@/shared/helpers/exel.parser';
import { parseWeeklyReportExcel, toDate, WeeklyReportColumns } from '@/shared/helpers/weeklyReport.parser';
import { BadRequestException } from '@nestjs/common';
import { eachWeekOfInterval, endOfMonth, endOfWeek, format, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UploadedReportsRepository } from '@/infrastructure/core/typeOrm/repositories/uploadedReports.repository';
import { OtherExpensesRepository } from '@/infrastructure/core/typeOrm/repositories/otherExpenses.repository';
import { calculateFileHash, createRecordKey } from '@/shared/helpers/fileHash.helper';

export class ReportsUseCase {
  readonly #logger = new Logger(ReportsUseCase.name);
  readonly #productRepository: ProductRepository;
  readonly #financeRepository: FinanceReportsRepository;
  readonly #weeklyReportRepository: WeeklyFinanceReportRepository;
  readonly #uploadedReportRepository: UploadedReportsRepository;
  readonly #otherExpensesRepository: OtherExpensesRepository;

  constructor(
    productRepository: ProductRepository,
    financeRepository: FinanceReportsRepository,
    weeklyReportRepository: WeeklyFinanceReportRepository,
    uploadedReportRepository: UploadedReportsRepository,
    otherExpensesRepository: OtherExpensesRepository,
  ) {
    this.#productRepository = productRepository;
    this.#financeRepository = financeRepository;
    this.#weeklyReportRepository = weeklyReportRepository;
    this.#uploadedReportRepository = uploadedReportRepository;
    this.#otherExpensesRepository = otherExpensesRepository;
  }

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

    const columnNames = getExcelColumnNames(file.buffer);
    this.#logger.log(`[uploadDetailedReport] orgId=${dto.organizationId}, file="${file.originalname}", columns: ${JSON.stringify(columnNames)}`);

    const rows = parseExcel<WbFinanceRow>(file.buffer);
    this.#logger.log(`[uploadDetailedReport] parsed ${rows.length} rows from Excel`);

    const recordsToCreate: Array<{
      entity: any;
      key: string;
    }> = [];

    let skippedNoProduct = 0;
    const missedNmIds = new Set<number>();

    for (const row of rows) {
      const nmID = toNumber(row[WbFinanceColumns.NOMENCLATURE_CODE]);

      const product = await this.#productRepository.findOne({
        where: { nmID, organizationId: dto.organizationId },
      });

      if (!product) {
        skippedNoProduct++;
        if (missedNmIds.size < 10) missedNmIds.add(nmID);
        continue;
      }

      const entity = mapWbRowToFinanceEntity(row, product.id);
      const key = createRecordKey({
        productId: entity.productId,
        saleDate: entity.saleDate,
        srid: entity.srid,
        documentType: entity.documentType,
      });

      recordsToCreate.push({ entity, key });
    }

    if (skippedNoProduct > 0) {
      this.#logger.warn(
        `[uploadDetailedReport] skipped ${skippedNoProduct} rows — product not found for nmIDs: ${[...missedNmIds].join(', ')}${missedNmIds.size === 10 ? '...' : ''}`,
      );
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

    this.#logger.log(
      `[uploadDetailedReport] done: saved=${result.length}, duplicates=${duplicatesSkipped}, skippedNoProduct=${skippedNoProduct}, total=${rows.length}`,
    );

    return {
      success: true,
      message: `Loaded ${result.length} new detailed finance records${duplicatesSkipped > 0 ? `, ${duplicatesSkipped} duplicates skipped` : ''}${skippedNoProduct > 0 ? `, ${skippedNoProduct} rows skipped (product not found in org)` : ''}`,
      count: result.length,
      duplicatesSkipped,
      skippedNoProduct,
      totalProcessed: rows.length,
    };
  }

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
    const { organizationId, startDate, endDate, taxRate = 0 } = dto;

    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const [weeklyMetrics, detailedStats, costPriceData, externalExpenses] = await Promise.all([
      this.#weeklyReportRepository.getDashboardMetrics({ organizationId, startDate: start, endDate: end }),
      this.#financeRepository.getDetailedSalesStats({ organizationId, startDate: start, endDate: end }),
      this.#financeRepository.getCostPriceForPeriod({ organizationId, startDate: start, endDate: end }),
      this.#otherExpensesRepository.getTotalForPeriod(organizationId, start, end),
    ]);

    const revenue = detailedStats.revenue;
    const sellerPayout = detailedStats.sellerPayout;
    const wbCommission = detailedStats.wbCommission;
    const acquiring = detailedStats.acquiring;
    const delivery = detailedStats.deliveryCost;
    const storage = weeklyMetrics.totalStorage;
    const fines = weeklyMetrics.totalFines;
    const acceptance = weeklyMetrics.totalAcceptanceCost;
    const otherDeductions = weeklyMetrics.totalOtherCharges;
    const totalCostPrice = costPriceData.totalCostPrice;

    // Оплата на Р/С = К перечислению − логистика − хранение − штрафы − приёмка − удержания
    const totalToReceive = sellerPayout - delivery - fines - acceptance - otherDeductions - storage;
    // Налог = Оплата на Р/С × ставка
    const tax = totalToReceive * taxRate;
    // ЧП = Оплата на Р/С − налог − себестоимость − внешние расходы
    const netProfit = totalToReceive - tax - totalCostPrice - externalExpenses;
    const wbDeductions = wbCommission + delivery + storage + fines + acceptance + otherDeductions;
    const marginality = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const totalCosts = wbDeductions + totalCostPrice + tax + externalExpenses;
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
        subtitle: `${detailedStats.salesQty} прод. / ${detailedStats.returnsQty} возвр.`,
        change: null,
        isNegative: false,
      },
      {
        title: 'К перечислению',
        value: `${Math.round(sellerPayout).toLocaleString('ru-RU')} сом`,
        subtitle: 'После комиссии WB и эквайринга',
        change: null,
        isNegative: false,
      },
      {
        title: 'Оплата на Р/С',
        value: `${Math.round(totalToReceive).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((totalToReceive / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: totalToReceive < 0,
      },
      {
        title: 'Комиссия WB',
        value: `${Math.round(wbCommission - acquiring).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? (((wbCommission - acquiring) / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Эквайринг',
        value: `${Math.round(acquiring).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((acquiring / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Логистика',
        value: `${Math.round(delivery).toLocaleString('ru-RU')} сом`,
        subtitle: `${detailedStats.totalDeliveries} доставок`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Хранение',
        value: `${Math.round(storage).toLocaleString('ru-RU')} сом`,
        subtitle: 'Из еженедельного отчёта',
        change: null,
        isNegative: true,
      },
      {
        title: 'Штрафы',
        value: `${Math.round(fines).toLocaleString('ru-RU')} сом`,
        subtitle: 'Из еженедельного отчёта',
        change: null,
        isNegative: true,
      },
      {
        title: 'Приёмка',
        value: `${Math.round(acceptance).toLocaleString('ru-RU')} сом`,
        subtitle: 'Из еженедельного отчёта',
        change: null,
        isNegative: true,
      },
      {
        title: 'Удержания',
        value: `${Math.round(otherDeductions).toLocaleString('ru-RU')} сом`,
        subtitle: 'Прочие удержания площадки',
        change: null,
        isNegative: true,
      },
      {
        title: 'Себестоимость',
        value: `${Math.round(totalCostPrice).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((totalCostPrice / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: false,
      },
      {
        title: 'Налог',
        value: `${Math.round(tax).toLocaleString('ru-RU')} сом`,
        subtitle: taxRate > 0 ? `УСН ${(taxRate * 100).toFixed(0)}% от Р/С` : 'Не задан',
        change: null,
        isNegative: true,
      },
      {
        title: 'Внешние расходы',
        value: `${Math.round(externalExpenses).toLocaleString('ru-RU')} сом`,
        subtitle: `${revenue > 0 ? ((externalExpenses / revenue) * 100).toFixed(1) : 0}% от выручки`,
        change: null,
        isNegative: true,
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
    const { organizationId, startDate, endDate, taxRate = 0 } = dto;

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
        sales: detail?.salesQty || 0,
        returns: detail?.returnsQty || 0,
        deliveries: detail?.deliveries || 0,
      };
    });

    const avgData = weeks.map((week) => {
      const key = format(week.start, 'yyyy-MM-dd');
      const detail = detailsMap.get(key);
      const cost = costsMap.get(key);

      if (!detail) {
        return { price: 0, commission: 0, transfer: 0, delivery: 0, cost: 0, margin: 0 };
      }

      // netQty = Количество продаж - Количество возврата (знаменатель средних)
      // Деление вычисляется здесь т.к. требует cross-row данных из двух источников
      const netQty = Math.max(detail.salesQty - detail.returnsQty, 1);

      return {
        price: Math.round(detail.revenue / netQty),
        commission: Math.round(detail.wbCommission / netQty),
        transfer: Math.round(detail.sellerPayout / netQty),
        delivery: Math.round(detail.deliveryCost / netQty),
        cost: Math.round((cost?.totalCost || 0) / netQty),
        margin: 0,
      };
    });

    const financeData = await Promise.all(weeks.map(async (week) => {
      const key = format(week.start, 'yyyy-MM-dd');
      const summary = summariesMap.get(key);
      const detail = detailsMap.get(key);
      const cost = costsMap.get(key);

      if (!summary && !detail) {
        return {
          revenue: 0,
          commission: 0,
          commissionPct: '-',
          acquiring: 0,
          transfer: 0,
          deliveryCost: 0,
          deliveryCostForward: 0,
          deliveryCostReturn: 0,
          fines: 0,
          acceptance: 0,
          deductions: 0,
          storage: 0,
          totalPay: 0,
          cost: 0,
          tax: 0,
          externalExpenses: 0,
          profit: 0,
        };
      }

      const rev = detail?.revenue || 0;
      const payout = detail?.sellerPayout || 0;
      const commission = detail?.wbCommission || 0;
      const acquiring = detail?.acquiring || 0;
      const delCost = detail?.deliveryCost || 0;
      const delCostForward = detail?.deliveryCostForward || 0;
      const delCostReturn = detail?.deliveryCostReturn || 0;
      const storage = summary?.totalStorage || 0;
      const fines = summary?.totalFines || 0;
      const acceptance = summary?.totalAcceptanceCost || 0;
      const deductions = summary?.otherCharges || 0;
      const totalCost = cost?.totalCost || 0;
      const extExp = await this.#otherExpensesRepository.getTotalForPeriod(organizationId, week.start, week.end);
      // Оплата на Р/С = К перечислению − логистика − хранение − штрафы − приёмка − удержания
      const totalPay = payout - delCost - fines - acceptance - deductions - storage;
      const tax = totalPay * taxRate;
      const profit = totalPay - tax - totalCost - extExp;

      return {
        revenue: Math.round(rev),
        commission: Math.round(commission - acquiring),
        commissionPct: rev > 0 ? `${(((commission - acquiring) / rev) * 100).toFixed(1)}%` : '-',
        acquiring: Math.round(acquiring),
        transfer: Math.round(payout),
        deliveryCost: Math.round(delCost),
        deliveryCostForward: Math.round(delCostForward),
        deliveryCostReturn: Math.round(delCostReturn),
        fines: Math.round(fines),
        acceptance: Math.round(acceptance),
        deductions: Math.round(deductions),
        storage: Math.round(storage),
        totalPay: Math.round(totalPay),
        cost: Math.round(totalCost),
        tax: Math.round(tax),
        externalExpenses: Math.round(extExp),
        profit: Math.round(profit),
      };
    }));

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
      saleAmount: Number(item.wbSaleAmount),
      commission: Number(item.wbSaleAmount) - Number(item.sellerPayout),
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

  /**
   * Диагностика: парсит Excel и возвращает список колонок + первые 3 строки.
   * Полезно для отладки несовпадения заголовков с WbFinanceColumns.
   */
  async previewDetailedReport(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Excel file not provided');
    }

    const columnNames = getExcelColumnNames(file.buffer);
    const rows = parseExcel<WbFinanceRow>(file.buffer);
    const preview = rows.slice(0, 3);

    const expectedColumns = Object.values(WbFinanceColumns);
    const missingColumns = expectedColumns.filter((col) => !columnNames.includes(col));
    const extraColumns = columnNames.filter((col) => !expectedColumns.includes(col as WbFinanceColumns));

    return {
      totalRows: rows.length,
      columnCount: columnNames.length,
      columns: columnNames,
      missingExpectedColumns: missingColumns,
      unexpectedColumns: extraColumns,
      preview,
    };
  }
}
