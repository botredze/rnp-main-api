import { Controller, Get, Query } from '@nestjs/common';
import { GetProductListQuery } from '@/shared/dtos/rnpAnalitics.dto';
import { RnpUseCase } from '@/useCase/controllers/rnp/rnp.useCase';

@Controller('api/rnp-statistic')
export class RnpStatisticController {
  readonly #rnpMainUseCase: RnpUseCase;

  constructor(rnpMainUseCase: RnpUseCase) {
    this.#rnpMainUseCase = rnpMainUseCase;
  }

  @Get('list')
  async getProductList(@Query() query: GetProductListQuery) {
    return await this.#rnpMainUseCase.getList(query);
  }

  async getMainRnpStats() {}
}
