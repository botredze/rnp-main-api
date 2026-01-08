import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCostPriceModel } from '@/infrastructure/core/typeOrm/models/productCostPrice.model';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { CostPriceController } from '@/infrastructure/apps/main/modules/costPrice/costPrice.controller';
import { ProductCostPriceRepository } from '@/infrastructure/core/typeOrm/repositories/productCostPrice.repository';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';
import { CostPriceUseCase } from '@/useCase/controllers/costPrices/costPrice.useCase';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCostPriceModel, ProductsModel, OrganizationsModel])],
  controllers: [CostPriceController],
  providers: [
    ProductCostPriceRepository,
    ProductRepository,

    {
      provide: CostPriceUseCase,
      useFactory: (productCostPriceRepository: ProductCostPriceRepository, productRepository: ProductRepository) =>
        new CostPriceUseCase(productCostPriceRepository, productRepository),
      inject: [ProductCostPriceRepository, ProductRepository],
    },
  ],
})
export class CostPriceModule {}
