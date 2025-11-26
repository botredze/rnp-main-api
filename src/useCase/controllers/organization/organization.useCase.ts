import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { CreateOrganizationDto, GetUserOrganizationsDto, UpdateOrganizationDto } from '@/shared/dtos/organization.dto';
import { OrganizationsModel, OrganizationStatuses } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { DateTime } from 'luxon';
import { SchedulerRepository } from '@/infrastructure/core/typeOrm/repositories/scheduler.repository';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';

export class OrganizationUseCase {
  readonly #organizationRepository: OrganizationRepository;
  readonly #userRepository: UserRepository;
  readonly #schedularRepository: SchedulerRepository;

  constructor(
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    schedulerRepository: SchedulerRepository,
  ) {
    this.#organizationRepository = organizationRepository;
    this.#userRepository = userRepository;
    this.#schedularRepository = schedulerRepository;
  }

  async getList(userId: number) {
    const list = await this.#organizationRepository.findMany({ where: { userId } });

    if (list.length === 0) {
      return [];
    }

    return list;
  }

  async createOrganization(query: CreateOrganizationDto) {
    console.log(query, 'query');
    const { organizationName, userId, apiKey } = query;

    const user = await this.#userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const organizationPayload = new OrganizationsModel({
      organizationName,
      userId,
      apiKey,
      createdDate: new Date(),
      paymentDate: DateTime.now().plus({ days: 30 }).toJSDate(),
    });

    const organization = await this.#organizationRepository.create(organizationPayload);

    if (organization) {
      const taskPayload = new SchedularTasksModel({});
      this.#schedularRepository.create(taskPayload);
    }
    return organization;
  }

  async updateOrganization(query: UpdateOrganizationDto) {
    const { apiKey, organizationName, id } = query;

    const organization = await this.#organizationRepository.findOne({ where: { id } });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const payload = new OrganizationsModel({
      organizationName,
      apiKey,
    });

    const result = await this.#organizationRepository.updateById(id, payload);

    if (result) {
      const taskPayload = new SchedularTasksModel({});
      this.#schedularRepository.create(taskPayload);
    }

    return result;
  }

  async diactivateOrganization(query: GetUserOrganizationsDto) {
    const { organizationId } = query;

    const organization = await this.#organizationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const result = await this.#organizationRepository.updateById(organizationId, {
      isActive: false,
      status: OrganizationStatuses.Inactive,
    });

    return result;
  }
}
