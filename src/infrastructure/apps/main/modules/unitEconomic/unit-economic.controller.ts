import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UnitEconomicUseCase } from '@/useCase/controllers/unitEconomic/unitEconomic.useCases';
import { UnitEconomicCreateDto, UnitEconomicGetQueryDto } from '@/shared/dtos/unitEconomic.dto';
import { UnitEconomicProductsModel } from '@/infrastructure/core/typeOrm/models/unitEconomicProducts.model';

@Controller('unit-economic')
export class UnitEconomicController {
  readonly #unitEconomicUseCase: UnitEconomicUseCase;

  constructor(unitEconomicUseCase: UnitEconomicUseCase) {
    this.#unitEconomicUseCase = unitEconomicUseCase;
  }

  @Get('/list')
  async getList(@Query() query: UnitEconomicGetQueryDto): Promise<Array<UnitEconomicProductsModel>> {
    return await this.#unitEconomicUseCase.getList(query);
  }

  @Get()
  async getById(@Query() query: UnitEconomicGetQueryDto): Promise<UnitEconomicProductsModel> {
    return await this.#unitEconomicUseCase.getById(query);
  }

  @Post('/create')
  async createProduct(@Body() body: UnitEconomicCreateDto) {
    return await this.#unitEconomicUseCase.create(body);
  }

  async updateProduct() {}

  async deleteProduct() {}
}
