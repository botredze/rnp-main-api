import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { AuthDto } from '@/shared/dtos/auth.dto';
import { JwtService } from '@/infrastructure/services/jwtService/jwt.service';

export class AuthUseCases {
  readonly #userRepository: UserRepository;
  readonly #jwtService: JwtService;

  constructor(userRepository: UserRepository, jwtService: JwtService) {
    this.#userRepository = userRepository;
    this.#jwtService = jwtService;
  }

  async login(query: AuthDto) {
    console.log(query, 'query');
    const { login, password } = query;

    const user = await this.#userRepository.findOne({
      where: { login, password },
    });

    if (!user) {
      throw new Error('User not found or invalid password');
    }

    const payload = { id: user.id, login: user.login };
    const token = this.#jwtService.signAccessToken(payload);

    return {
      id: user.id,
      token,
    };
  }

  async logout(query: any) {}
}
