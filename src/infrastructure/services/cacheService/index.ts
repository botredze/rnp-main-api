import { createClient, RedisClientType } from 'redis';
import { RedisCacheConfig } from '@/infrastructure/services/cacheService/config';
import { hashMD5 } from '@/shared/helpers/string';

export class RedisCacheService {
  #client: RedisClientType;
  #prefix: string;
  #keyMaxLength: number;

  constructor(config: RedisCacheConfig) {
    const { host, port, username, password, prefix = 'cache', keyMaxLength = 250 } = config;

    this.#prefix = prefix;
    this.#keyMaxLength = keyMaxLength;

    this.#client = createClient({
      username,
      password,
      socket: {
        host,
        port,
      },
    });
  }

  async init(): Promise<void> {
    await this.#client.connect();
  }

  /* ===================== helpers ===================== */

  private buildKey(key: string): string {
    let fullKey = this.#prefix ? `${this.#prefix}:${key}` : key;

    if (fullKey.length > this.#keyMaxLength) {
      fullKey = hashMD5(fullKey);
    }

    return fullKey;
  }

  /* ===================== API ===================== */

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return (await this.#client.exists(fullKey)) === 1;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const fullKey = this.buildKey(key);
    const value = await this.#client.get(fullKey);

    if (value === null) return undefined;

    return JSON.parse(value.toString()) as T;
  }

  async set<T>(key: string, value: T, ttl: number = 60): Promise<void> {
    const fullKey = this.buildKey(key);
    const encoded = JSON.stringify(value);

    if (ttl > 0) {
      await this.#client.set(fullKey, encoded, { EX: ttl });
    } else {
      await this.#client.set(fullKey, encoded);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    await this.#client.del(fullKey);
  }

  /* ===================== decorator ===================== */

  decorator<This, Args extends any[], Return extends Promise<any>>(
    getKey: (...args: Args) => string,
    params?: { ttl?: number },
  ) {
    const ttl = params?.ttl ?? 60;
    const self = this;

    return function (target: (this: This, ...args: Args) => Return, _context: ClassMethodDecoratorContext<This>) {
      return async function (this: This, ...args: Args) {
        const key = getKey(...args);

        const cached = await self.get<Awaited<Return>>(key);
        if (cached !== undefined) {
          return cached;
        }

        const result = await target.apply(this, args);

        await self.set(key, result, ttl);

        return result;
      };
    };
  }
}
