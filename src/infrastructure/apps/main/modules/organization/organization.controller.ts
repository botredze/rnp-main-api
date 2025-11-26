import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { OrganizationUseCase } from '@/useCase/controllers/organization/organization.useCase';
import { Request } from 'express';
import { CreateOrganizationDto, GetUserOrganizationsDto, UpdateOrganizationDto } from '@/shared/dtos/organization.dto';

@Controller('api/organization')
export class OrganizationController {
  readonly #ogranizationUseCase: OrganizationUseCase;

  constructor(organizationUseCase: OrganizationUseCase) {
    this.#ogranizationUseCase = organizationUseCase;
  }

  @Post('create')
  async create(@Body() body: CreateOrganizationDto, @Req() req: Request) {
    const { user } = req;
    const { userId } = body;

    console.log(user, 'user');
    console.log(userId, 'userId');

    const query = {
      ...body,
    };

    if (userId) {
      query.userId = userId;
    } else {
      query.userId = user.id;
    }

    return this.#ogranizationUseCase.createOrganization(query);
  }

  @Get('list')
  async list(@Req() req: Request, @Query() query: GetUserOrganizationsDto) {
    const { user } = req;

    const params = {
      userId: 0,
    };

    if (query) {
      params.userId = query.userId;
    } else {
      params.userId = user.id;
    }

    return await this.#ogranizationUseCase.getList(params.userId);
  }

  @Post('update')
  async update(@Body() body: UpdateOrganizationDto) {
    return await this.#ogranizationUseCase.updateOrganization(body);
  }

  @Get('deactivate')
  async diactivateOrganization(@Query() query: GetUserOrganizationsDto) {
    return await this.#ogranizationUseCase.diactivateOrganization(query);
  }
}
