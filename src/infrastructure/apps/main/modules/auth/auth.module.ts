import { Module } from '@nestjs/common';
import { AuthUseCases } from '@/useCase/controllers/auth/auth.useCases';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';
import { AuthController } from '@/infrastructure/apps/main/modules/auth/auth.controller';
import { JwtService } from '@/infrastructure/services/jwtService/jwt.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserModel])],
  controllers: [AuthController],
  providers: [
    UserRepository,
    JwtService,
    {
      provide: AuthUseCases,
      useFactory: (userRepository: UserRepository, jwtService: JwtService) =>
        new AuthUseCases(userRepository, jwtService),
      inject: [UserRepository, JwtService],
    },
  ],
})
export class AuthModule {}
