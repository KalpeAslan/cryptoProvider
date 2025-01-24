import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { EvmService } from './evm/evm.service';
import { RedisRepository } from '../shared/repository/redis.repository';
import {
  TransactionStatus,
  TransactionData,
  TransactionResponse,
  ProcessTransactionJob,
} from '../shared/types/transaction.types';

@Injectable()
export class TransactionService {
  constructor(
    @InjectQueue('transactions') private readonly transactionsQueue: Queue,
    private readonly redis: RedisRepository,
    private readonly evmService: EvmService,
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

    await this.redis.set(`tx:${transactionId}`, transactionData);

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
    const transaction = await this.redis.get<TransactionData>(`tx:${id}`);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.onChainTxHash) {
      const onChainData = await this.evmService.getTransaction(
        transaction.onChainTxHash,
        transaction.network,
      );
      if (onChainData) {
        transaction.onChainData = onChainData;
      }
    }

    const response: TransactionResponse = { ...transaction, id };
    return response;
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    onChainTxHash?: string,
  ): Promise<TransactionResponse> {
    const transaction = await this.redis.get<TransactionData>(`tx:${id}`);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = status;
    transaction.updatedAt = new Date().toISOString();
    if (onChainTxHash) {
      transaction.onChainTxHash = onChainTxHash;
    }

    await this.redis.set(`tx:${id}`, transaction);

    const response: TransactionResponse = { ...transaction, id };
    return response;
  }

  async getPendingTransactions() {
    return this.redis.getTransactionsByStatus(
      TransactionStatus.PENDING_CONFIRMATION,
    );
  }
}
