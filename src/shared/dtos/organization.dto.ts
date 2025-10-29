import { IsNumber, IsString } from 'class-validator';


export class CreateOrganizationDto {

  @IsString()
  organizationName: string;

  @IsString()
  apiKey: string;

  @IsNumber()
  userId: number;

  constructor(params: Partial<CreateOrganizationDto> = {}) {
    Object.assign(this, params);
  }
}

export class GetUserOrganizationsDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  organizationId?: number;

  constructor(params: Partial<GetUserOrganizationsDto> = {}) {
    Object.assign(this, params);
  }
}