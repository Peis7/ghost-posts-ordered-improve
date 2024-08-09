import { DynamicModule, Module } from '@nestjs/common';
import { CACHE_OPTIONS } from './constants';
import { CacheModuleAsyncOptions } from './interfaces/options';
import IORedis from 'ioredis';

@Module({})
export class CacheModule {
  static async registerAsync({
    useFactory,
    imports,
    inject,
  }: CacheModuleAsyncOptions): Promise<DynamicModule> {
    const redisProvider = {
      provide: CACHE_OPTIONS,
      useFactory: async (...args) => {
        const { connectionOptions, onClientReady } = await useFactory(...args);

        const client = await new IORedis(connectionOptions);

        onClientReady(client);

        return client;
      },
      inject,
    };
    return {
      module: CacheModule,
      imports,
      providers: [redisProvider],
      exports: [redisProvider],
    };
  }
}
