import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { SchedulerRepository } from '@/infrastructure/core/typeOrm/repositories/scheduler.repository';
import { CreateOrganizationDto } from '@/shared/dtos/organization.dto';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';


export class CreateOrganizationUseCase {

  readonly #organizationRepository: OrganizationRepository;
  readonly #schedulerRepository: SchedulerRepository;
  readonly #userRepository: UserRepository;

  constructor(
    organizationRepository: OrganizationRepository,
    schedulerRepository: SchedulerRepository,
    userRepository: UserRepository
  ) {
    this.#organizationRepository = organizationRepository;
    this.#schedulerRepository = schedulerRepository;
    this.#userRepository = userRepository;
  }

  public async execute(query: CreateOrganizationDto): Promise<any> {
    const {organizationName, apiKey, userId } = query;

    const user = await this.#userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }


    const existOrganization = await this.#organizationRepository.exist({organizationName})

    if(existOrganization) {
      throw  new Error('Organization already exist');
    }

    const organization = await this.#organizationRepository.create({
      organizationName,
      apiKey,
      user,
      createdDate: new Date(),
      isActive: true,
      paymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return organization;
  }
}