import { Module } from '@nestjs/common';
import {
  RedisModule as NestRedisModule,
  RedisModuleOptions,
} from '@liaoliaots/nestjs-redis';
import { RedisRepository } from './redis.repository';
import { SharedConfig } from '../../config/shared.config';
import { SharedConfigModule } from '../../config/shared-config.module';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [SharedConfigModule],
      useFactory: async (
        sharedConfig: SharedConfig,
      ): Promise<RedisModuleOptions> => ({
        config: {
          url: sharedConfig.redis.url,
          connectTimeout: 10000,
          retryStrategy: (times: number): number => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        },
      }),
      inject: [SharedConfig],
    }),
  ],
  providers: [RedisRepository],
  exports: [RedisRepository],
})
export class RedisRepositoryModule {}
