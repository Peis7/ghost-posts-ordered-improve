import { ModuleMetadata } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

export interface CacheModuleOptions {
  connectionOptions: RedisOptions;
  onClientReady?: (client: Redis) => void;
}

export interface CacheModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
  inject?: any[];
}
