import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/core/typeOrm/repositories/user.repository';
import { CreateOrganizationDto, GetUserOrganizationsDto, UpdateOrganizationDto } from '@/shared/dtos/organization.dto';
import { OrganizationsModel, OrganizationStatuses } from '@/infrastructure/core/typeOrm/models/organizations.model';
import { DateTime } from 'luxon';
import { SchedulerRepository } from '@/infrastructure/core/typeOrm/repositories/scheduler.repository';
import { SchedularTasksModel } from '@/infrastructure/core/typeOrm/models/schedularTasks.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In, Not } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { WbApiValidatorService } from '@/shared/validators/wb-api-validator.service';

export class OrganizationUseCase {
  readonly #organizationRepository: OrganizationRepository;
  readonly #userRepository: UserRepository;
  readonly #schedularRepository: SchedulerRepository;
  readonly #eventEmitter: EventEmitter2;
  readonly #wbApiValidator: WbApiValidatorService;

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
    this.#wbApiValidator = new WbApiValidatorService();
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

  private async checkApiKeyExists(apiKey: string, excludeOrganizationId?: number): Promise<boolean> {
    const whereCondition: any = {
      apiKey,
      status: In([OrganizationStatuses.Active, OrganizationStatuses.Inited, OrganizationStatuses.Inactive]),
    };

    if (excludeOrganizationId) {
      whereCondition.id = Not(excludeOrganizationId);
    }

    const existingOrganization = await this.#organizationRepository.findOne({
      where: whereCondition,
    });

    return !!existingOrganization;
  }

  async createOrganization(query: CreateOrganizationDto) {
    console.log(query, 'query');
    const { organizationName, userId, apiKey } = query;

    const apiKeyExists = await this.checkApiKeyExists(apiKey);
    if (apiKeyExists) {
      throw new BadRequestException({
        message: 'Этот API ключ уже используется другой организацией. Пожалуйста, используйте другой ключ',
        field: 'apiKey',
      });
    }

    const validationResult = await this.#wbApiValidator.validateApiKey(apiKey);

    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: validationResult.error,
        field: 'apiKey',
      });
    }

    const user = await this.#userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // 4. Создание организации
    const organizationPayload = new OrganizationsModel({
      organizationName,
      userId,
      apiKey,
      createdDate: new Date(),
      paymentDate: DateTime.now().plus({ days: 30 }).toJSDate(),
    });

    const organization = await this.#organizationRepository.create(organizationPayload);

    // 5. Создание задачи для инициализации
    if (organization) {
      const taskPayload = new SchedularTasksModel({
        name: `organization_init_executor:${organization.id}`,
        scheduleRule: '0 0 * * *',
        status: 'active',
        runAfter: 0, // Запустить немедленно
      });

      await this.#schedularRepository.create(taskPayload);
      this.#eventEmitter.emit('schedular.tasks.updated');
    }

    return organization;
  }

  async updateOrganization(query: UpdateOrganizationDto) {
    const { apiKey, organizationName, id } = query;

    // 1. Проверка существования организации
    const organization = await this.#organizationRepository.findOne({ where: { id } });
    if (!organization) {
      throw new BadRequestException('Организация не найдена');
    }

    // 2. Проверка на дубликат API ключа (если ключ изменился)
    if (apiKey !== organization.apiKey) {
      const apiKeyExists = await this.checkApiKeyExists(apiKey, id);
      if (apiKeyExists) {
        throw new BadRequestException({
          message: 'Этот API ключ уже используется другой организацией. Пожалуйста, используйте другой ключ',
          field: 'apiKey',
        });
      }

      // 3. Валидация нового API ключа через WB API
      const validationResult = await this.#wbApiValidator.validateApiKey(apiKey);

      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: validationResult.error,
          field: 'apiKey',
        });
      }
    }

    // 4. Обновление организации
    const payload = new OrganizationsModel({
      organizationName,
      apiKey,
      status: OrganizationStatuses.Inited,
    });

    const result = await this.#organizationRepository.updateById(id, payload);

    // 5. Пересоздание задачи инициализации (если API ключ изменился)
    if (result && apiKey !== organization.apiKey) {
      await this.#schedularRepository.delete({ name: `organization_init_executor:${organization.id}` });

      const taskPayload = new SchedularTasksModel({
        name: `organization_init_executor:${organization.id}`,
        scheduleRule: '0 0 * * *',
        status: 'active',
        runAfter: 0,
      });

      await this.#schedularRepository.create(taskPayload);
      this.#eventEmitter.emit('schedular.tasks.updated');
    }

    return result;
  }

  async diactivateOrganization(query: GetUserOrganizationsDto) {
    const { organizationId, action } = query;

    const organization = await this.#organizationRepository.findOne({ where: { id: organizationId } });
    if (!organization) {
      throw new BadRequestException('Организация не найдена');
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
