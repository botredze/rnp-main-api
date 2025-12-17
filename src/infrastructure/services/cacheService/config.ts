export interface RedisCacheConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  prefix?: string;
  keyMaxLength?: number;
}
