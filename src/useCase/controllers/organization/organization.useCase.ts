import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';

export class OrganizationUseCase {
  readonly #organizationRepository: OrganizationRepository;
  readonly #userRepository: UserRepository;

  constructor(organizationRepository: OrganizationRepository) {
    this.#organizationRepository = organizationRepository;
  }

  async getList(userId: number) {
    const list = await this.#organizationRepository.findMany({ where: { userId } });

    if (list.length === 0) {
      throw new Error('No organizations found');
    }

    return list;
  }
}
