import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import { OrganizationInfoDto } from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/organizationInfo.dto';

export class GetOrganizationInfoExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };
  readonly #organizationRepository: OrganizationRepository;

  readonly #baseUrl = 'https://common-api.wildberries.ru/api/v1/seller-info';
  #axiosService: AxiosInstance;

  constructor(
    organizationRepository: OrganizationRepository,
    private readonly configService: ConfigService,
  ) {
    super();
    this.#axiosService = axios.create();
    this.#organizationRepository = organizationRepository;
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async execute(apiKey: string, id: number): Promise<void> {
    this.#initAxios(apiKey);

    try {
      console.log(`[OrgInfo] Запрос информации об организации id=${id}`);
      const response = await this.#axiosService.get(this.#baseUrl);

      if (response.status === 200) {
        const data: OrganizationInfoDto = response.data;

        const updateData = {
          sid: data.sid,
          tradeMark: data.tradeMark,
          wbOrganizationName: data.name,
        };

        await this.#organizationRepository.updateById(id, updateData);
        console.log(`[OrgInfo] Обновлено: name="${data.name}", tradeMark="${data.tradeMark}", sid="${data.sid}"`);
      } else {
        throw Error(`This error is ${response.status}`);
      }
    } catch (err) {
      console.error('[OrgInfo] Ошибка:', err?.response?.data || err?.message || err);
    }
  }
}
