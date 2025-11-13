import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UnitEconomicGetQueryDto {
  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @IsOptional()
  @IsNumber()
  productId?: number;

  constructor(params: Partial<UnitEconomicGetQueryDto> = {}) {
    Object.assign(this, params);
  }
}

export class UnitEconomicMetricsDto {
  @IsString()
  label: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percent: number | null;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value: number | null;

  @IsBoolean()
  isEditable: boolean;

  @IsString()
  symbol: string;

  @IsBoolean()
  activeLine: boolean;

  @IsBoolean()
  disabledInput: boolean;

  @IsBoolean()
  disabledView: boolean;

  @IsBoolean()
  seconder: boolean;

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
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Type(() => Number)
  ssp: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitEconomicMetricsDto)
  tableData: Array<UnitEconomicMetricsDto>;

  constructor(params: Partial<UnitEconomicCreateDto> = {}) {
    Object.assign(this, params);
  }
}
