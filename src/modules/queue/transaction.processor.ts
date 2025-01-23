import { Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { EvmService } from '../transaction/evm/evm.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  TransactionStatus,
  ProcessTransactionJob,
  TransactionConfirmationJob,
} from '../shared/types/transaction.types';

type TransactionQueue = Queue<
  ProcessTransactionJob | TransactionConfirmationJob
>;

@Processor('transactions')
export class TransactionProcessor {
  constructor(
    private readonly evmService: EvmService,
    private readonly transactionService: TransactionService,
  ) {}

  @Process('process')
  async processTransaction(job: Job<ProcessTransactionJob>) {
    const { hash, from, to, amount, privateKey, network, tokenAddress } =
      job.data;

    try {
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
