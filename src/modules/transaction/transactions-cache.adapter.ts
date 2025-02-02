import { Injectable, Logger } from '@nestjs/common';
import { RedisRepository } from '../shared/repository/redis/redis.repository';
import {
  TransactionData,
  UpdateTransactionParams,
} from './types/transaction.types';
import { TransactionStatus } from './constants/transaction.constants';

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

  async updateTransaction({
    id,
    data,
    useTTL,
  }: UpdateTransactionParams): Promise<TransactionData | null> {
    this.logger.log(`Updating transaction status with id: ${id}`);
    const transaction = await this.getTransaction(id);
    if (!transaction) {
      return null;
    }

    const updatedTransaction = {
      ...transaction,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const ttl5Minutes = 1000 * 60 * 5;
    await this.redis.set(
      `${TRANSACTION_KEY_PREFIX}${id}`,
      updatedTransaction,
      useTTL ? ttl5Minutes : undefined,
    );
    return updatedTransaction;
  }

  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<TransactionData[]> {
    this.logger.log(`Getting transactions with status: ${status}`);
    const pattern = `${TRANSACTION_KEY_PREFIX}*`;
    const keys = await this.redis.getKeysByPattern(pattern);
    const transactions = await this.redis.multiGet<TransactionData>(keys);
    this.logger.log(
      `Found ${transactions.length} transactions with status: ${status}`,
    );

    return transactions
      .filter(
        (tx): tx is TransactionData => tx !== null && tx.status === status,
      )
      .map((tx) => ({
        ...tx,
        privateKey: '',
        createdAt: new Date(tx.createdAt).toISOString(),
        updatedAt: new Date(tx.updatedAt).toISOString(),
      }));
  }

  async deleteTransaction(id: string): Promise<void> {
    this.logger.log(`Deleting transaction with id: ${id}`);
    await this.redis.delete(`${TRANSACTION_KEY_PREFIX}${id}`);
  }
}
