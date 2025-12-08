import { IsArray, IsBoolean, IsEnum, IsInt, IsIP, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export enum DbDriver {
  Postgres = 'postgres',
}

export class Environment {
  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsIP('4')
  HOST: string = '0.0.0.0';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  // Keep Alive
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  KEEP_ALIVE_TIMEOUT: number = 60;

  // CORS
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsOptional()
  CORS_ORIGINS: Array<string> = ['*'];

  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsOptional()
  CORS_METHODS: Array<string> = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  AMQP_URL: string = 'amqp://localhost:5672';

  @IsEnum(DbDriver)
  @IsOptional()
  DB_DRIVER: DbDriver = DbDriver.Postgres;

  @IsString()
  DB_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  DB_PORT = 5432;

  @IsString()
  DB_USERNAME: string = 'postgres';

  @IsString()
  DB_DATABASE: string = 'wikkeo';

  @IsString()
  DB_PASSWORD!: string;

  @IsBoolean()
  @IsOptional()
  DB_DEBUG: boolean = false;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  EXECUTOR_PORT: number = 5000;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  SCHEDULER_PORT: number = 5001;

  // Queue
  @IsString()
  RABBITMQ_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  RABBITMQ_PORT: number = 5672;

  @IsString()
  RABBITMQ_USERNAME: string = 'rabbitmq';

  @IsString()
  RABBITMQ_PASSWORD: string = 'rabbitmq';

  @IsString()
  @IsOptional()
  RABBITMQ_QUEUE_NAME: string = 'data_analysis_queue';

  @IsString()
  RABBITMQ_VHOST: string = '/';
}

// TODO: separate
export function validate(config: Record<string, unknown>) {
  const configInstance = plainToInstance(Environment, config);

  const errors = validateSync(configInstance, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return configInstance;
}
