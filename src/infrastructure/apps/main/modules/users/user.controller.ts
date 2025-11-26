import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DeactiveUser, GetUserDto, UpdateUserDto, UserDto } from '@/shared/dtos/user.dto';
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

  @Get('deactivate')
  async diactivateUser(@Query() query: DeactiveUser) {
    return this.#userUseCase.diactiveUsers(query);
  }

  @Post('create')
  async create(@Body() body: UserDto) {
    return this.#userUseCase.createUser(body);
  }

  @Post('update')
  async updateUser(@Body() body: UpdateUserDto) {
    return await this.#userUseCase.updateUser(body);
  }
}
