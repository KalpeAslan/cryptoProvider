import { Module } from '@nestjs/common';
import { BullModule, BullModuleOptions } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { EvmService } from './evm/evm.service';
import { TransactionProcessor } from './queue/transaction.processor';
import { EvmGasComputingService } from './evm/evm-gas-computing.service';
import { TransactionsCacheAdapter } from './transactions-cache.adapter';
import { TvmService } from './tvm/tvm.service';
import { TvmGasComputingService } from './tvm/tvm-gas-computing.service';
import { SolanaService } from './svm/svm.service';
import { SharedConfigModule } from '../shared/config/shared-config.module';
import { RedisRepositoryModule } from '../shared/repository/redis/redis-repository.module';
import { EncryptionService } from '../shared/encryption/encryption.service';
import { ToolsController } from './tools/tools.controller';

@Module({
  imports: [
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
    RedisRepositoryModule,
  ],
  controllers: [TransactionController, ToolsController],
  providers: [
    TransactionsCacheAdapter,
    TransactionService,
    EvmGasComputingService,
    EvmService,
    TransactionProcessor,
    TvmService,
    TvmGasComputingService,
    SolanaService,
    EncryptionService,
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
