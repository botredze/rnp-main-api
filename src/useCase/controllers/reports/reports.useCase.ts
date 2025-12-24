import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { FinanceReportsRepository } from '@/infrastructure/core/typeOrm/repositories/financeReports.repository';
import { ReportsDto, WbFinanceColumns, WbFinanceRow } from '@/shared/dtos/reports.dto';
import { mapWbRowToFinanceEntity, parseExcel, toNumber } from '@/shared/helpers/exel.parser';

export class ReportsUseCase {
  readonly #productRepository: ProductRepository;
  readonly #financeRepository: FinanceReportsRepository;

  constructor(productRepository: ProductRepository, financeRepository: FinanceReportsRepository) {
    this.#productRepository = productRepository;
    this.#financeRepository = financeRepository;
  }

  async parseReportExcel(file: Express.Multer.File, query: ReportsDto) {
    if (!file) {
      throw new Error('Excel file not provided');
    }

    const rows = parseExcel<WbFinanceRow>(file.buffer);

    const result: Array<any> = [];

    for (const row of rows) {
      const product = await this.#productRepository.findOne({
        where: { nmID: toNumber(row[WbFinanceColumns.NOMENCLATURE_CODE]) },
      });

      if (!product) continue;

      const entity = mapWbRowToFinanceEntity(row, product.id);

      result.push(entity);
      await this.#financeRepository.create(entity);
    }

    return result;
  }

  async getPnlReport() {}

  async getPnlReportForProduct() {
    return null;
  }
}
