import { Logger } from '@nestjs/common';
import { NetworkType, CustomCode, CustomCodesEnum } from '@/modules/shared';
import { TransactionData } from '../types/transaction.types';
import { TransactionStatus } from '../constants/transaction.constants';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

export abstract class AbstractOnchainService {
  // Initialize providers
  protected abstract initializeProviders(): void;

  // Send transactions
  abstract sendTransaction(
    params: CreateTransactionDto,
  ): Promise<TransactionData>;

  abstract sendNativeTransaction(
    params: CreateTransactionDto,
  ): Promise<TransactionData>;

  abstract sendTokenTransaction(
    params: CreateTransactionDto,
  ): Promise<TransactionData>;

  // Get transaction
  abstract getTransaction(
    txHash: string,
    network: NetworkType,
  ): Promise<TransactionData | null>;

  protected mapTransactionStatus(status: string): TransactionStatus {
    switch (status) {
      case 'SUCCESS':
      case 'CONFIRMED':
        return TransactionStatus.CONFIRMED;
      case 'FAILED':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PENDING_CONFIRMATION;
    }
  }
}
