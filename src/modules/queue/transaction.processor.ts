import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { EvmService } from '../transaction/evm/evm.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  TransactionStatus,
  ProcessTransactionJob,
  TransactionConfirmationJob,
} from '../shared/types/transaction.types';
import { Logger } from '@nestjs/common';

type TransactionQueue = Queue<
  ProcessTransactionJob | TransactionConfirmationJob
>;

@Processor('transactions')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(
    private readonly evmService: EvmService,
    private readonly transactionService: TransactionService,
  ) {}

  @Process('process')
  async processTransaction(job: Job<ProcessTransactionJob>) {
    const { hash, from, to, amount, privateKey, network, tokenAddress } =
      job.data;

    try {
      // Get transaction info to check status
      const transaction =
        await this.transactionService.getTransactionInfo(hash);

      // Only process if status is PENDING_QUEUE
      if (transaction.status !== TransactionStatus.PENDING_QUEUE) {
        this.logger.warn(
          `Skipping transaction ${hash} as status is ${transaction.status}`,
        );
        return;
      }

      const tx = await this.evmService.sendTransaction({
        from,
        to,
        amount,
        privateKey,
        network,
        tokenAddress,
      });

      await this.transactionService.updateTransactionStatus(
        hash,
        TransactionStatus.PENDING_CONFIRMATION,
        tx.hash,
      );

      const queue = job.queue as TransactionQueue;
      await queue.add('check-confirmation', {
        hash,
        txHash: tx.hash,
        network,
      });
    } catch (error) {
      await this.transactionService.updateTransactionStatus(
        hash,
        TransactionStatus.FAILED,
      );
      throw error;
    }
  }

  @Process('check-confirmation')
  async checkConfirmation(job: Job<TransactionConfirmationJob>) {
    const { hash, txHash, network } = job.data;

    try {
      const tx = await this.evmService.getTransaction(txHash, network);
      if (tx?.confirmations && tx.confirmations > 0) {
        await this.transactionService.updateTransactionStatus(
          hash,
          TransactionStatus.CONFIRMED,
        );
      } else {
        const queue = job.queue as TransactionQueue;
        await queue.add('check-confirmation', job.data, { delay: 5000 });
      }
    } catch {
      const queue = job.queue as TransactionQueue;
      await queue.add('check-confirmation', job.data, { delay: 5000 });
    }
  }
}
