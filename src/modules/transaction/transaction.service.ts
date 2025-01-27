import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { EvmService } from './evm/evm.service';
import {
  TransactionStatus,
  TransactionData,
  TransactionResponse,
  ProcessTransactionJob,
} from '../shared/types/transaction.types';
import { TransactionsCacheAdapter } from './transactions-cache.adapter';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transactions') private readonly transactionsQueue: Queue,
    private readonly evmService: EvmService,
    private readonly transactionsCache: TransactionsCacheAdapter,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    const transactionId = uuidv4();
    const transactionData: TransactionData = {
      ...createTransactionDto,
      status: TransactionStatus.PENDING_QUEUE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.transactionsCache.setTransaction(transactionId, transactionData);

    const jobData: ProcessTransactionJob = {
      ...createTransactionDto,
      id: transactionId,
    };

    await this.transactionsQueue.add('process', jobData);

    const response: TransactionResponse = {
      id: transactionId,
      ...transactionData,
    };
    return response;
  }

  async getTransactionInfo(id: string): Promise<TransactionResponse> {
    const transaction = await this.transactionsCache.getTransaction(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.hash && !transaction.onChainData) {
      const onChainData = await this.evmService.getTransaction(
        transaction.hash,
        transaction.network,
      );
      if (onChainData) {
        transaction.onChainData = onChainData;
      }
    }

    const response: TransactionResponse = { ...transaction, id };
    await this.transactionsCache.setTransactionWithTTL(id, response);
    return response;
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    hash?: string,
  ): Promise<TransactionResponse> {
    const updatedTransaction =
      await this.transactionsCache.updateTransactionStatus(id, status, hash);

    if (!updatedTransaction) {
      throw new Error('Transaction not found');
    }

    const response: TransactionResponse = { ...updatedTransaction, id };
    await this.transactionsCache.setTransactionWithTTL(id, response);
    return response;
  }

  async getPendingTransactions() {
    return this.transactionsCache.getTransactionsByStatus(
      TransactionStatus.PENDING_CONFIRMATION,
    );
  }
}
