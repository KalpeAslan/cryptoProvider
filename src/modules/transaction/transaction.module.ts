import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { EvmService } from './evm/evm.service';
import { TransactionProcessor } from '../queue/transaction.processor';
import { SharedConfigModule } from '../shared/config/shared-config.module';
import { RedisRepositoryModule } from 'src/modules/shared/repository/redis-repository.module';
import { EvmGasComputingService } from './evm/evm-gas-computing.service';
import { TransactionsCacheAdapter } from './transactions-cache.adapter';

@Module({
  imports: [
    RedisRepositoryModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'transactions',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      },
    } as BullModuleOptions & {
      defaultJobOptions: { removeOnComplete: boolean; removeOnFail: boolean };
    }),
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: 'localhost',
          port: 6379,
        },
      },
    ]),
    SharedConfigModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionsCacheAdapter,
    TransactionService,
    EvmGasComputingService,
    EvmService,
    TransactionProcessor,
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
