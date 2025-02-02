import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { EvmService } from '../evm/evm.service';
import { TransactionService } from '../transaction.service';
import {
  ProcessTransactionJob,
  TransactionConfirmationJob,
  PendingTransactionCheckJob,
} from '../types/transaction.types';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { TransactionStatus } from '../constants/transaction.constants';

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

  @Process('process')
  async processTransaction(job: Job<ProcessTransactionJob>) {
    this.transactionService.processTransaction(job.data);
  }

  @Process('check-confirmation')
  async checkConfirmation(job: Job<TransactionConfirmationJob>) {
    const { id, txHash, network } = job.data;

    try {
      const tx = await this.evmService.getTransaction(txHash, network);
      if (tx) {
        await this.transactionService.updateTransaction({
          id,
          data: {
            status: TransactionStatus.CONFIRMED,
          },
        });
      } else {
        const queue = job.queue as TransactionQueue;
        await queue.add('check-confirmation', job.data, { delay: 5000 });
      }
    } catch {
      const queue = job.queue as TransactionQueue;
      await queue.add('check-confirmation', job.data, { delay: 5000 });
    }
  }

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
          const networkTx = await this.evmService.getTransaction(
            tx.hash,
            tx.network,
          );

          if (networkTx) {
            const transactionId = (tx as unknown as { id: string }).id;
            await this.transactionService.updateTransaction({
              id: transactionId,
              data: {
                status: TransactionStatus.CONFIRMED,
              },
            });

            this.logger.log(
              `Transaction ${transactionId} confirmed and included in blockchain`,
            );
          }
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
