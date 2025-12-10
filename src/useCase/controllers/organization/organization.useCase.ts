import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { CreateOrganizationDto, GetUserOrganizationsDto, UpdateOrganizationDto } from '@/shared/dtos/organization.dto';
import { OrganizationsModel, OrganizationStatuses } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { DateTime } from 'luxon';
import { SchedulerRepository } from '@/infrastructure/core/typeOrm/repositories/scheduler.repository';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In } from 'typeorm';

export class OrganizationUseCase {
  readonly #organizationRepository: OrganizationRepository;
  readonly #userRepository: UserRepository;
  readonly #schedularRepository: SchedulerRepository;
  readonly #eventEmitter: EventEmitter2;

  constructor(
    organizationRepository: OrganizationRepository,
    userRepository: UserRepository,
    schedulerRepository: SchedulerRepository,
    eventEmitter: EventEmitter2,
  ) {
    this.#organizationRepository = organizationRepository;
    this.#userRepository = userRepository;
    this.#schedularRepository = schedulerRepository;
    this.#eventEmitter = eventEmitter;
  }

  async getList(userId: number) {
    const list = await this.#organizationRepository.findMany({
      where: {
        userId,
        status: In([OrganizationStatuses.Active, OrganizationStatuses.Inited]),
      },
    });

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
      const taskPayload = new SchedularTasksModel({
        name: `organization_init_executor:${organization.id}`,
        scheduleRule: '0 0 * * *',
        status: 'active',
      });

      this.#schedularRepository.create(taskPayload);
      this.#eventEmitter.emit('schedular.tasks.updated');
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
      status: OrganizationStatuses.Inited,
    });

    const result = await this.#organizationRepository.updateById(id, payload);

    if (result) {
      const taskPayload = new SchedularTasksModel({
        name: `organization_init_executor:${organization.id}`,
        scheduleRule: '0 0 * * *',
        status: 'active',
      });

      this.#eventEmitter.emit('schedular.tasks.updated');
      this.#schedularRepository.create(taskPayload);
    }

    return result;
  }

  async diactivateOrganization(query: GetUserOrganizationsDto) {
    const { organizationId, action } = query;

    const organization = await this.#organizationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (action === 'active') {
      const result = await this.#organizationRepository.updateById(organizationId, {
        isActive: true,
        status: OrganizationStatuses.Inited,
      });

      return result;
    } else if (action === 'diactive') {
      const result = await this.#organizationRepository.updateById(organizationId, {
        isActive: false,
        status: OrganizationStatuses.Inactive,
      });

      return result;
    } else if (action === 'delete') {
      const result = await this.#organizationRepository.updateById(organizationId, {
        isActive: false,
        status: OrganizationStatuses.Deleted,
      });

      return result;
    }
  }
}
