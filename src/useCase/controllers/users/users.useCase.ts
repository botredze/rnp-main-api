import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { GetUserDto, UserDto } from '@/shared/dtos/user.dto';
import { UserModel, UserStatus } from '@/infrastructure/core/typeOrm/models/user.model';

export class UsersUseCase {
  readonly #usersRepository: UserRepository;

  constructor(usersRepository: UserRepository) {
    this.#usersRepository = usersRepository;
  }

  async getList(query: GetUserDto): Promise<any> {
    console.log(query, 'query');
    const { role, status, orderBy } = query;

    let where: any = {};
    let order: any = undefined;

    if (role) {
      where = { ...where, role };
    }

    if (status) {
      where = { ...where, status };
    }

    if (orderBy?.field) {
      order = {
        [orderBy.field]: orderBy.order || 'ASC',
      };
    }

    console.log(where, 'where');
    const users = await this.#usersRepository.findMany({
      where,
      order,
    });

    return users;
  }

  async createUser(body: UserDto) {
    const { fio, role, password, login } = body;
    const existingUser = await this.#usersRepository.findOne({ where: { login } });

    if (existingUser) throw new Error('User with this login already exists');

    const createPayload = new UserModel({ fio, role, password, login, status: UserStatus.ACTIVE });

    return await this.#usersRepository.create(createPayload);
  }

  async updateUser(id: number, body: UserDto) {}

  async diactiveUsers() {}
}
