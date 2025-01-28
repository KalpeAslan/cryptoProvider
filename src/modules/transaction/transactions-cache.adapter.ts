import { Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '../shared/repository/redis.repository';
import {
  TransactionData,
  TransactionStatus,
} from '../shared/types/transaction.types';

const TRANSACTION_KEY_PREFIX = 'tx:';

@Injectable()
export class TransactionsCacheAdapter {
  private readonly logger = new Logger(TransactionsCacheAdapter.name);

  constructor(private readonly redis: RedisRepository) {}

  async setTransaction(id: string, data: TransactionData): Promise<void> {
    this.logger.log(`Setting transaction with id: ${id}`);
    await this.redis.set(`${TRANSACTION_KEY_PREFIX}${id}`, data);
  }

  async getTransaction(id: string): Promise<TransactionData | null> {
    return this.redis.get<TransactionData>(`${TRANSACTION_KEY_PREFIX}${id}`);
  }

  async updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    hash?: string,
  ): Promise<TransactionData | null> {
    this.logger.log(`Updating transaction status with id: ${id}`);
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      return null;
    }

    const updatedTransaction: TransactionData = {
      ...transaction,
      status,
      updatedAt: new Date().toISOString(),
      ...(hash && { hash }),
    };

    await this.redis.set(`${TRANSACTION_KEY_PREFIX}${id}`, updatedTransaction);
    return updatedTransaction;
  }

  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<TransactionData[]> {
    this.logger.log(`Getting transactions with status: ${status}`);
    const transactions = await this.redis.getTransactionsByStatus(status);
    return transactions.map((tx) => ({
      ...tx,
      privateKey: '',
      createdAt: new Date(tx.createdAt).toISOString(),
      updatedAt: new Date(tx.updatedAt).toISOString(),
    })) as TransactionData[];
  }

  async deleteTransaction(id: string): Promise<void> {
    this.logger.log(`Deleting transaction with id: ${id}`);
    await this.redis.delete(`${TRANSACTION_KEY_PREFIX}${id}`);
  }
}
