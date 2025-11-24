import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { GetUserDto, UserDto } from '@/shared/dtos/user.dto';
import { UsersUseCase } from '@/useCase/controllers/users/users.useCase';

@Controller('api/users')
export class UserController {
  readonly #userUseCase: UsersUseCase;

  constructor(userUseCase: UsersUseCase) {
    this.#userUseCase = userUseCase;
  }

  @Get('list')
  async getUsers(@Query() query: GetUserDto) {
    return this.#userUseCase.getList(query);
  }

  @Get(':id')
  async getById() {}

  @Post('create')
  async create(@Body() body: UserDto) {
    return this.#userUseCase.createUser(body);
  }

  @Put(':id')
  async updateById() {}
}
