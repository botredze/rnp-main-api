import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export class GetOrganizationInfoExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  };

  #axiosService: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    super();
    this.#axiosService = axios.create();
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

  async execute(apiKey: string): Promise<void> {
    this.#initAxios(apiKey);

    const path = `/organizations?status=${status}`;
    try {
      const response = await this.#axiosService.get(path);
      console.log(response.data);
    } catch (err) {
      console.error('Ошибка при запросе:', err);
    }
  }
}
