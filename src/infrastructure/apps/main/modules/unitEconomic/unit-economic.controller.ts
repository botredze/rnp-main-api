import { Controller, Get } from '@nestjs/common';

@Controller('api/unit-economic')
export class UnitEconomicController {
  @Get('/list')
  async getList() {}

  @Get(':id')
  async getById() {}

  @Get('/create')
  async createProduct() {}

  async updateProduct() {}

  async deleteProduct() {}
}
