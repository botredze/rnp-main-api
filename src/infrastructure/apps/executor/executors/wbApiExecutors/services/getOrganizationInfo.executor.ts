import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { OrganizationRepository } from '@/infrastructure/core/typeOrm/repositories/organization.repository';
import {
  OrganizationInfoDto
} from '@/infrastructure/apps/executor/executors/wbApiExecutors/types/organizationInfo.dto';

export class GetOrganizationInfoExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };
  readonly #organizationRepository: OrganizationRepository;

  #axiosService: AxiosInstance;

  constructor(
    organizationRepository: OrganizationRepository,
    private readonly configService: ConfigService
  ) {
    super();
    this.#axiosService = axios.create();
    this.#organizationRepository = organizationRepository;
  }

  #initAxios(apiKey: string) {
    const baseURL = this.configService.get<string>('WB_API_URL');
    this.#axiosService = axios.create({
      baseURL,
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async execute(apiKey: string, id: number): Promise<void> {
    this.#initAxios(apiKey);

    const path = `/api/v1/seller-info`;
    try {
      const response = await this.#axiosService.get(path);

      if(response.status === 200) {
        const data: OrganizationInfoDto = response.data

        const updateData = {
          sid: data.sid,
          tradeMark: data.tradeMark,
          wbOrganizationName: data.name
        }

        await this.#organizationRepository.updateById(id, updateData)
        console.log('Организация обновлена');
      }else {
        throw Error(`This error is ${response.status}`)
      }
    } catch (err) {
      console.error('Ошибка при запросе:', err);
    }
  }
}
