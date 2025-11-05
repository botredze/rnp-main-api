import { Controller, Get, Req } from '@nestjs/common';
import { OrganizationUseCase } from '@/useCase/controllers/organization/organization.useCase';
import { Request } from 'express';

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
  async list(@Req() req: Request) {
    const { user } = req;

    return await this.#ogranizationUseCase.getList(user.id);
  }
}
