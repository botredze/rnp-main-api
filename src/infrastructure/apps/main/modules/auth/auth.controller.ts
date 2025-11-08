import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthDto } from '@/shared/dtos/auth.dto';
import { AuthUseCases } from '@/useCase/controllers/auth/auth.useCases';

@Controller('api/auth')
export class AuthController {
  readonly #authUseCase: AuthUseCases;

  constructor(authUseCase: AuthUseCases) {
    this.#authUseCase = authUseCase;
  }

  @Post('login')
  async login(@Body() body: AuthDto) {
    console.log(body, 'body');
    return this.#authUseCase.login(body);
  }

  @Get('logout')
  async logout() {}
}
