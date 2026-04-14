import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  organizationName: string;

  @IsString()
  apiKey: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  constructor(params: Partial<CreateOrganizationDto> = {}) {
    Object.assign(this, params);
  }
}

export class GetUserOrganizationsDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  organizationId?: number;

  action?: 'diactive' | 'active' | 'delete';

  constructor(params: Partial<GetUserOrganizationsDto> = {}) {
    Object.assign(this, params);
  }
}

export class UpdateOrganizationDto extends CreateOrganizationDto {
  id: number;
}

export class TriggerSyncDto {
  @IsNumber()
  organizationId: number;

  constructor(params: Partial<TriggerSyncDto> = {}) {
    Object.assign(this, params);
  }
}
