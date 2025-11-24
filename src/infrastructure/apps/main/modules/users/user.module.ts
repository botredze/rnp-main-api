import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@/infrastructure/apps/main/modules/users/user.controller';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { UsersUseCase } from '@/useCase/controllers/users/users.useCase';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel])],
  controllers: [UserController],
  providers: [
    UserRepository,
    {
      provide: UsersUseCase,
      useFactory: (userRepository: UserRepository) => new UsersUseCase(userRepository),
      inject: [UserRepository],
    },
  ],
})
export class UserModule {}
