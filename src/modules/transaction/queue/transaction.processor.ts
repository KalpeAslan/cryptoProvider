import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { EvmService } from '../evm/evm.service';
import { TransactionService } from '../transaction.service';
import {
  ProcessTransactionJob,
  TransactionConfirmationJob,
  PendingTransactionCheckJob,
  TransactionData,
} from '../types/transaction.types';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { TransactionStatus } from '../constants/transaction.constants';
import { TvmService } from '../tvm/tvm.service';
import { NetworkType } from '@/modules/shared/types/network.types';
import { SolanaService } from '../svm/svm.service';
type TransactionQueue = Queue<
  | ProcessTransactionJob
  | TransactionConfirmationJob
  | PendingTransactionCheckJob
>;

@Processor('transactions')
export class TransactionProcessor implements OnModuleInit {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(
    private readonly evmService: EvmService,
    private readonly tvmService: TvmService,
    private readonly svmService: SolanaService,
    private readonly transactionService: TransactionService,
    @InjectQueue('transactions')
    private readonly transactionQueue: TransactionQueue,
  ) {}

  async onModuleInit() {
    // Setup recurring job to check pending transactions every 5 minutes
    await this.transactionQueue.add(
      'check-pending-transactions',
      { timestamp: Date.now() } as PendingTransactionCheckJob,
      {
        repeat: {
          every: 5 * 60 * 1000, // 5 minutes
        },
      },
    );
  }

  // @Process('send-transactions')
  // async processTransaction(job: Job<ProcessTransactionJob>) {
  //   this.transactionService.processTransaction(job.data);
  // }

  @Process('check-pending-transactions')
  async checkPendingTransactions(_: Job<PendingTransactionCheckJob>) {
    try {
      const pendingTransactions =
        await this.transactionService.getPendingTransactions();

      for (const tx of pendingTransactions) {
        if (!tx?.hash) {
          continue;
        }

        try {
          let networkTx: TransactionData | null = null;

          switch (tx.network) {
            case NetworkType.TRON:
            case NetworkType.NILE:
              networkTx = await this.tvmService.getTransaction(
                tx.hash,
                tx.network,
              );
              break;
            case NetworkType.SOLANA:
            case NetworkType.SOLANA_DEVNET:
              console.log('tx.hash', tx.hash);
              networkTx = await this.svmService.getTransaction(
                tx.hash,
                tx.network,
              );
              break;
            default:
              networkTx = await this.evmService.getTransaction(
                tx.hash,
                tx.network,
              );
              break;
          }

          if (networkTx) {
            await this.transactionService.updateTransaction({
              id: tx.id!,
              data: {
                status: TransactionStatus.CONFIRMED,
              },
            });
          }

          this.logger.log(
            `Transaction ${tx.id} confirmed and included in blockchain`,
          );
        } catch (err) {
          const transactionId = (tx as unknown as { id: string }).id;
          this.logger.error(
            `Failed to check transaction ${transactionId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to process pending transactions: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
