import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateProductCostDto, UpdateProductCostDto } from '@/shared/dtos/productCost.dto';
import { CostPriceUseCase } from '@/useCase/controllers/costPrices/costPrice.useCase';

@Controller('cost-prices')
export class CostPriceController {
  readonly #costPriceUseCase: CostPriceUseCase;

  constructor(costPriceUseCase: CostPriceUseCase) {
    this.#costPriceUseCase = costPriceUseCase;
  }

  @Post()
  async create(@Body() dto: CreateProductCostDto) {
    return await this.#costPriceUseCase.addProductCostPrice(dto);
  }

  @Get('product/:productId')
  async getProductCostPrice(
    @Param('productId') productId: number,
    @Query('date') date?: string,
    @Query('includeHistory') includeHistory?: boolean,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return await this.#costPriceUseCase.getProductCostPrice({
      productId: Number(productId),
      date,
      includeHistory: includeHistory === true,
      includeInactive: includeInactive === true,
    });
  }

  @Get('effective/:productId')
  async getEffectivePrice(
    @Param('productId') productId: number,
    @Query('size') size?: string,
    @Query('date') date?: string,
  ) {
    return await this.#costPriceUseCase.getEffectiveCostPrice(
      Number(productId),
      size,
      date ? new Date(date) : undefined,
    );
  }

  @Get('organization/:organizationId')
  async getOrganizationProducts(
    @Param('organizationId') organizationId: number,
    @Query('date') date?: string,
    @Query('hasProductLevelPrice') hasProductLevelPrice?: boolean,
    @Query('hasSizePrices') hasSizePrices?: boolean,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return await this.#costPriceUseCase.getProductsWithCostPrices({
      organizationId: Number(organizationId),
      date: date ? new Date(date) : undefined,
      hasProductLevelPrice: hasProductLevelPrice === true,
      hasSizePrices: hasSizePrices === true,
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
    });
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: Omit<UpdateProductCostDto, 'id'>) {
    return await this.#costPriceUseCase.updateProductCostPrice({
      ...dto,
      id: Number(id),
    });
  }

  @Put(':id/deactivate')
  async deactivate(@Param('id') id: number) {
    return await this.#costPriceUseCase.deactivateCostPrice(Number(id));
  }

  @Delete(':id')
  async delete(@Param('id') id: number) {
    return await this.#costPriceUseCase.deleteCostPrice(Number(id));
  }
}
