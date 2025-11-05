import { Module } from '@nestjs/common';
import { RnpStatisticController } from '@/infrastructure/apps/main/modules/rnp-statistic/rnp-statistic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';
import { RnpUseCase } from '@/useCase/controllers/rnp/rnp.useCase';
import { ProductRepository } from '@/infrastructure/core/typeOrm/repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductsModel])],
  controllers: [RnpStatisticController],
  providers: [
    ProductRepository,
    {
      provide: RnpUseCase,
      useFactory: (productRepository: ProductRepository) => new RnpUseCase(productRepository),
      inject: [ProductRepository],
    },
  ],
})
export class RnpStatisticModule {}
