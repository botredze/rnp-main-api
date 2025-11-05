import { IsString } from 'class-validator';

export class AuthDto {
  @IsString()
  login: string;
  @IsString()
  password: string;

  constructor(params: Partial<AuthDto> = {}) {
    Object.assign(this, params);
  }
}
