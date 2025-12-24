import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ReportsUseCase } from '@/useCase/controllers/reports/reports.useCase';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReportsDto } from '@/shared/dtos/reports.dto';

@Controller('reports')
export class ReportsController {
  readonly #reportsUseCase: ReportsUseCase;

  constructor(reportsUseCase: ReportsUseCase) {
    this.#reportsUseCase = reportsUseCase;
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadReport(@UploadedFile() file: Express.Multer.File, @Query() query: ReportsDto) {
    return await this.#reportsUseCase.parseReportExcel(file, query);
  }

  async getStatistics(@Query() query: ReportsDto) {
    return await this.#reportsUseCase.getPnlReport();
  }

  async getStatisticForProduct() {
    return await this.#reportsUseCase.getPnlReportForProduct();
  }
}
