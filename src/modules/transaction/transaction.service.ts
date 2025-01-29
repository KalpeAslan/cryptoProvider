import { Injectable, NotFoundException } from '@nestjs/common';
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
} from './types/transaction.types';
import { TransactionsCacheAdapter } from './transactions-cache.adapter';
import { CUSTOM_CODES } from '../shared/constants/custom-codes.constants';

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
      code: CUSTOM_CODES.TRANSACTION_CREATED.code,
      message: CUSTOM_CODES.TRANSACTION_CREATED.message,
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

  async getTransactionInfo(
    id: string,
    deleteAfter: boolean = false,
  ): Promise<TransactionResponse> {
    const transaction = await this.transactionsCache.getTransaction(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with id:${id} not found`);
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
    if (deleteAfter && transaction.status === TransactionStatus.CONFIRMED) {
      await this.transactionsCache.deleteTransaction(id);
    }
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
      throw new NotFoundException(`Transaction with id:${id} not found`);
    }

    const response: TransactionResponse = { ...updatedTransaction, id };
    return response;
  }

  async getPendingTransactions() {
    return this.transactionsCache.getTransactionsByStatus(
      TransactionStatus.PENDING_CONFIRMATION,
    );
  }
}
