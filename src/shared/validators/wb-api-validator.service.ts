import axios from 'axios';

export class WbApiValidatorService {
  async validateApiKey(apiKey: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      if (!apiKey || apiKey.trim().length === 0) {
        return {
          isValid: false,
          error: 'API ключ не может быть пустым',
        };
      }

      const response = await axios.get('https://common-api.wildberries.ru/ping', {
        headers: {
          Authorization: apiKey,
        },
        timeout: 10000,
      });

      console.log(response, 'response');
      if (response.status === 200) {
        return {
          isValid: true,
        };
      }

      return {
        isValid: false,
        error: 'Неизвестная ошибка при проверке API ключа',
      };
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;

        if (status === 401) {
          return {
            isValid: false,
            error: 'Неверный API ключ. Проверьте правильность введенного ключа',
          };
        } else if (status === 403) {
          return {
            isValid: false,
            error: 'Доступ запрещен. API ключ не имеет необходимых прав',
          };
        } else if (status === 429) {
          return {
            isValid: false,
            error: 'Превышен лимит запросов. Попробуйте позже',
          };
        } else {
          return {
            isValid: false,
            error: `Ошибка API Wildberries: ${error.response.statusText || 'Неизвестная ошибка'}`,
          };
        }
      } else if (error.request) {
        return {
          isValid: false,
          error: 'Не удалось подключиться к API Wildberries. Проверьте интернет-соединение',
        };
      } else {
        return {
          isValid: false,
          error: `Ошибка при проверке API ключа: ${error.message}`,
        };
      }
    }
  }
}
