import { TaskExecutor } from '@/infrastructure/apps/executor/facrory/taskExecutor';
import axios, { AxiosInstance } from 'axios';


export class GetAdvertingPaymentHistoryExecutor extends TaskExecutor {
  readonly #header = {
    'Content-Type': 'application/json',
  }

  readonly #baseUrl = ''
  #axiosService: AxiosInstance

  constructor() {
    super();
    this.#axiosService = axios.create();
  }

  #initAxios(apiKey: string) {
    this.#axiosService = axios.create({
      headers: {
        ...this.#header,
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }


  async execute(apiKey: string): Promise<void>{
    this.#initAxios(apiKey);

    try {

    }catch (error) {
      console.log(error, 'error');
    }
  }
}