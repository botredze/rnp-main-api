// controllers/reports.controller.ts
import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ReportsUseCase } from '@/useCase/controllers/reports/reports.useCase';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  GetDashboardDto,
  GetDetailedReportDto,
  GetSummaryReportDto,
  UploadDetailedReportDto,
  UploadWeeklyReportDto,
} from '@/shared/dtos/financeReports.dto';

@Controller('reports')
export class ReportsController {
  readonly #reportsUseCase: ReportsUseCase;

  constructor(reportsUseCase: ReportsUseCase) {
    this.#reportsUseCase = reportsUseCase;
  }

  /**
   * POST /reports/detailed/upload
   * Загрузить детализированный отчет (0_3.xlsx)
   */
  @Post('detailed/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDetailedReport(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadDetailedReportDto) {
    return await this.#reportsUseCase.uploadDetailedReport(file, dto);
  }

  /**
   * POST /reports/weekly/upload
   * Загрузить еженедельный отчет (Ежедневные_отчеты.xlsx)
   */
  @Post('weekly/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWeeklyReport(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadWeeklyReportDto) {
    return await this.#reportsUseCase.uploadWeeklyReport(file, dto);
  }

  /**
   * GET /reports/available-dates/:organizationId
   * Получить доступные даты отчетов
   */
  @Get('available-dates/:organizationId')
  async getAvailableDates(@Param('organizationId') organizationId: string) {
    return await this.#reportsUseCase.getAvailableDates(Number(organizationId));
  }

  /**
   * GET /reports/dashboard
   * Получить дашборд с метриками
   * Query params: organizationId, startDate?, endDate?
   */
  @Get('dashboard')
  async getDashboard(@Query() dto: GetDashboardDto) {
    return await this.#reportsUseCase.getOrganizationDashboard({
      organizationId: Number(dto.organizationId),
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  /**
   * GET /reports/summary
   * Получить сводный отчет по неделям
   * Query params: organizationId, startDate?, endDate?
   */
  @Get('summary')
  async getSummaryReport(@Query() dto: GetSummaryReportDto) {
    return await this.#reportsUseCase.getOrganizationSummaryReport({
      organizationId: Number(dto.organizationId),
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
  }

  @Get('detailed')
  async getDetailedReport(@Query() dto: GetDetailedReportDto) {
    return await this.#reportsUseCase.getDetailedReport({
      organizationId: Number(dto.organizationId),
      startDate: dto.startDate,
      endDate: dto.endDate,
      size: dto.size,
      documentType: dto.documentType,
      warehouse: dto.warehouse,
      searchQuery: dto.searchQuery,
      page: dto.page ? Number(dto.page) : 1,
      limit: dto.limit ? Number(dto.limit) : 50,
    });
  }

  @Get('detailed/filter-options/:organizationId')
  async getDetailedReportFilterOptions(@Param('organizationId') organizationId: string) {
    return await this.#reportsUseCase.getDetailedReportFilterOptions(Number(organizationId));
  }
}
