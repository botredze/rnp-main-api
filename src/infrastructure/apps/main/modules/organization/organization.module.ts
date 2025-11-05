import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { OrganizationUseCase } from '@/useCase/controllers/organization/organization.useCase';
import { OrganizationController } from '@/infrastructure/apps/main/modules/organization/organization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationsModel])],
  controllers: [OrganizationController],
  providers: [
    OrganizationRepository,
    {
      provide: OrganizationUseCase,
      useFactory: (organizationRepository: OrganizationRepository) => new OrganizationUseCase(organizationRepository),
      inject: [OrganizationRepository],
    },
  ],
})
export class OrganizationModule {}
