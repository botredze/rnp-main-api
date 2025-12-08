import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@/infrastructure/services/jwtService/jwt.service';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { NextFunction, Request, Response } from 'express';
import { getBearerToken } from '@/shared/helpers/jwt.helper';
import { UserModel } from '@/infrastructure/core/typeOrm/models/user.model';

declare module 'express' {
  interface Request {
    user?: UserModel;
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  readonly #usersRepository: UserRepository;
  readonly #jwtService: JwtService;

  constructor(userRepository: UserRepository, jwtService: JwtService) {
    this.#usersRepository = userRepository;
    this.#jwtService = jwtService;
  }

  async use(req: Request, _res: Response, next: NextFunction) {
    const token = getBearerToken(req);

    console.log('AuthMiddleware hit', req.path);

    if (!token || !this.#jwtService.isValidToken(token)) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    const userId = this.#jwtService.getUserId(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.#usersRepository.findOne({ where: { id: Number(userId) } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    req.user = user;
    next();
  }
}
