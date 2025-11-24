import { Controller, Get, Query, Req } from '@nestjs/common';
import { OrganizationUseCase } from '@/useCase/controllers/organization/organization.useCase';
import { Request } from 'express';
import { GetUserOrganizationsDto } from '@/shared/dtos/organization.dto';

@Controller('api/organization')
export class OrganizationController {
  readonly #ogranizationUseCase: OrganizationUseCase;

  constructor(organizationUseCase: OrganizationUseCase) {
    this.#ogranizationUseCase = organizationUseCase;
  }

  async create() {}

  async update() {}

  async diactivateOrganization() {}

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
}
