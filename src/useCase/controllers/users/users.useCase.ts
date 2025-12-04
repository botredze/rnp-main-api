import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { DeactiveUser, GetUserDto, UpdateUserDto, UserDto } from '@/shared/dtos/user.dto';
import { UserModel, UserStatus } from '@/infrastructure/core/typeOrm/models/user.model';
import { Not } from 'typeorm';

export class UsersUseCase {
  readonly #usersRepository: UserRepository;

  constructor(usersRepository: UserRepository) {
    this.#usersRepository = usersRepository;
  }

  async getList(query: GetUserDto): Promise<any> {
    console.log(query, 'query');
    const { role, status, orderBy } = query;

    let where: any = {
      status: status ? status : undefined,
    };

    if (!status) {
      where.status = Not(UserStatus.Deleted);
    }

    if (role) {
      where = { ...where, role };
    }

    let order: any = undefined;
    if (orderBy?.field) {
      order = {
        [orderBy.field]: orderBy.order || 'ASC',
      };
    }

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

  async updateUser(body: UpdateUserDto) {
    const { id, fio, role, password, login } = body;
    const existingUser = await this.#usersRepository.findOne({ where: { id: Number(id) } });

    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatePayload = new UserModel({ fio, role, password, login });
    return await this.#usersRepository.updateById(Number(id), updatePayload);
  }

  async diactiveUsers(query: DeactiveUser) {
    console.log(query, 'query');
    const { userId, status } = query;

    const existingUser = await this.#usersRepository.findOne({ where: { id: userId } });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (status === 'delete') {
      return await this.#usersRepository.updateById(userId, { status: UserStatus.Deleted });
    } else if (status === 'diactive') {
      return await this.#usersRepository.updateById(userId, { status: UserStatus.INACTIVE });
    }
  }
}
