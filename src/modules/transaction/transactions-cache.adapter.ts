import { Injectable } from '@nestjs/common';
import { RedisRepository } from '../shared/repository/redis.repository';
import {
  TransactionData,
  TransactionResponse,
  TransactionStatus,
} from '../shared/types/transaction.types';

const TRANSACTION_TTL = 120; // 2 minutes in seconds
const TRANSACTION_KEY_PREFIX = 'tx:';

@Injectable()
export class TransactionsCacheAdapter {
  constructor(private readonly redis: RedisRepository) {}

  async setTransaction(id: string, data: TransactionData): Promise<void> {
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
    const transactions = await this.redis.getTransactionsByStatus(status);
    return transactions.map((tx) => ({
      ...tx,
      privateKey: '',
      createdAt: new Date(tx.createdAt).toISOString(),
      updatedAt: new Date(tx.updatedAt).toISOString(),
    })) as TransactionData[];
  }

  async setTransactionWithTTL(
    id: string,
    response: TransactionResponse,
  ): Promise<void> {
    if (response.status === TransactionStatus.CONFIRMED) {
      await this.redis.set(
        `${TRANSACTION_KEY_PREFIX}${id}`,
        response,
        TRANSACTION_TTL,
      );
    }
  }
}
