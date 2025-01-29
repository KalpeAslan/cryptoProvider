import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { EvmService } from './evm/evm.service';
import {
  TransactionData,
  ProcessTransactionJob,
  UpdateTransactionParams,
} from './types/transaction.types';
import { TransactionsCacheAdapter } from './transactions-cache.adapter';
import { CUSTOM_CODES } from '../shared/constants/custom-codes.constants';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionStatus } from './constants/transaction.constants';
import { Logger } from '@nestjs/common';
import { CustomException } from '../shared/exceptions/custom-error.exception';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectQueue('transactions') private readonly transactionsQueue: Queue,
    private readonly evmService: EvmService,
    private readonly transactionsCache: TransactionsCacheAdapter,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
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

    const response: TransactionResponseDto = {
      id: transactionId,
      ...transactionData,
    };
    return response;
  }

  async getTransactionInfo(
    id: string,
    deleteAfter: boolean = false,
  ): Promise<TransactionResponseDto> {
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

    const response: TransactionResponseDto = { ...transaction, id };
    if (deleteAfter && transaction.status === TransactionStatus.CONFIRMED) {
      await this.transactionsCache.deleteTransaction(id);
    }
    return response;
  }

  async updateTransaction(
    params: UpdateTransactionParams,
  ): Promise<TransactionResponseDto> {
    const { id } = params;
    const updatedTransaction =
      await this.transactionsCache.updateTransaction(params);

    if (!updatedTransaction) {
      throw new NotFoundException(`Transaction with id:${id} not found`);
    }

    const response: TransactionResponseDto = { ...updatedTransaction, id };
    return response;
  }

  async getPendingTransactions() {
    return this.transactionsCache.getTransactionsByStatus(
      TransactionStatus.PENDING_CONFIRMATION,
    );
  }

  async processTransaction(data: ProcessTransactionJob) {
    const { id, network } = data;
    let transaction: TransactionData | null = null;

    try {
      // Get transaction info to check status
      transaction = await this.transactionsCache.getTransaction(id);
      if (!transaction) {
        throw new NotFoundException(`Transaction with id:${id} not found`);
      }

      // Only process if status is PENDING_QUEUE
      if (transaction.status !== TransactionStatus.PENDING_QUEUE) {
        this.logger.warn(
          `Skipping transaction ${id} as status is ${transaction.status}`,
        );
        return;
      }

      const tx = await this.evmService.sendTransaction(transaction);

      await this.transactionsCache.updateTransaction({
        id,
        data: {
          status: TransactionStatus.PENDING_CONFIRMATION,
          hash: tx.hash,
        },
      });

      await this.transactionsQueue.add('check-confirmation', {
        id,
        txHash: tx.hash,
        network,
      });
    } catch (error) {
      this.logger.error(
        `Transaction processing failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof CustomException) {
        await this.transactionsCache.updateTransaction({
          id,
          data: {
            status: TransactionStatus.FAILED,
            code: error.code,
          },
        });
      }
    }
  }
}
