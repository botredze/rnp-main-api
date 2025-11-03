import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

export interface UnitEconomicGetQueryDto {
  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @IsOptional()
  @IsNumber()
  productId?: number;
}

export class UnitEconomicMetricsDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number | null;

  @IsOptional()
  @IsNumber()
  value: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  percentOfPrice: number | null;

  @IsBoolean()
  isEditable: boolean;

  constructor(params: Partial<UnitEconomicMetricsDto> = {}) {
    Object.assign(this, params);
  }
}

export class UnitEconomicCreateDto {
  @IsNumber()
  organizationId: number;

  @IsString()
  productName: string;

  @IsString()
  vendorCode: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @IsPositive()
  salePrice: number;

  @IsNumber()
  ssp: number;

  @IsNumber()
  priceWithSpp: number;

  @IsNumber()
  wbDiscount: number;

  @IsNumber()
  priceWithWbDiscount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitEconomicMetricsDto)
  metrics: Array<UnitEconomicMetricsDto>;

  constructor(params: Partial<UnitEconomicCreateDto> = {}) {
    Object.assign(this, params);
  }
}
