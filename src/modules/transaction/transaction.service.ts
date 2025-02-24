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
import { CUSTOM_CODES, CustomCodesEnum, NetworkType } from '@/modules/shared';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionStatus } from './constants/transaction.constants';
import { Logger } from '@nestjs/common';
import { TransactionFactory } from './transaction.factory';
import { TvmService } from './tvm/tvm.service';
import { SolanaService } from './svm/svm.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectQueue('transactions') private readonly transactionsQueue: Queue,
    private readonly evmService: EvmService,
    private readonly tvmService: TvmService,
    private readonly solanaService: SolanaService,
    private readonly transactionsCache: TransactionsCacheAdapter,
  ) {}

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const transactionId = uuidv4();

    const { code, message } = CUSTOM_CODES[CustomCodesEnum.TRANSACTION_CREATED];
    const transactionData: TransactionData = {
      ...createTransactionDto,
      id: transactionId,
      status: TransactionStatus.PENDING_QUEUE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      code,
      message,
    };

    await this.transactionsCache.setTransaction(transactionId, transactionData);

    const jobData: ProcessTransactionJob = {
      ...createTransactionDto,
      id: transactionId,
    };

    this.processTransaction(jobData);

    return TransactionFactory.toResponseDto(transactionData, transactionId);
  }

  async getTransactionInfo(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsCache.getTransaction(id);

    if (!transaction) {
      throw new NotFoundException(`Transaction with id:${id} not found`);
    }

    if (transaction.hash) {
      let onChainData: TransactionData | null = null;
      switch (transaction.network) {
        case NetworkType.TRON:
        case NetworkType.NILE:
          onChainData = await this.tvmService.getTransaction(
            transaction.hash,
            transaction.network,
          );
          break;
        case NetworkType.SOLANA:
        case NetworkType.SOLANA_DEVNET:
          onChainData = await this.solanaService.getTransaction(
            transaction.hash,
            transaction.network,
          );
          break;
        default:
          onChainData = await this.evmService.getTransaction(
            transaction.hash,
            transaction.network,
          );
      }
      if (onChainData) {
        Object.assign(transaction, {
          gasUsed: onChainData.gasUsed,
          gasPrice: onChainData.gasPrice,
          chainId: onChainData.chainId,
          data: onChainData.data,
        });
      }
    }

    const isPending =
      transaction.status === TransactionStatus.PENDING_CONFIRMATION ||
      transaction.status === TransactionStatus.PENDING_QUEUE;

    this.logger.log(`isPending: ${isPending}`);
    if (!isPending) {
      await this.transactionsCache.deleteTransaction(id);
    }

    return TransactionFactory.toResponseDto(transaction, id);
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

    return TransactionFactory.toResponseDto(updatedTransaction, id);
  }

  async getPendingTransactions() {
    return this.transactionsCache.getTransactionsByStatus(
      TransactionStatus.PENDING_CONFIRMATION,
    );
  }

  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<TransactionResponseDto[]> {
    const transactions =
      await this.transactionsCache.getTransactionsByStatus(status);
    return transactions.map((transaction) =>
      TransactionFactory.toResponseDto(transaction, transaction.id as string),
    );
  }

  async deleteTransactionById(id: string): Promise<void> {
    const transaction = await this.transactionsCache.getTransaction(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with id:${id} not found`);
    }
    await this.transactionsCache.deleteTransaction(id);
  }

  async deleteTransactionsByStatus(status: TransactionStatus): Promise<void> {
    await this.transactionsCache.deleteTransactionsByStatus(status);
  }

  async processTransaction(data: ProcessTransactionJob) {
    const { id } = data;
    let transaction: TransactionData | null = null;

    try {
      transaction = await this.transactionsCache.getTransaction(id);
      if (!transaction) {
        throw new NotFoundException(`Transaction with id:${id} not found`);
      }

      if (transaction.status !== TransactionStatus.PENDING_QUEUE) {
        this.logger.warn(
          `Skipping transaction ${id} as status is ${transaction.status}`,
        );
        return;
      }

      let tx: TransactionData | null = null;

      try {
        switch (transaction.network) {
          case NetworkType.TRON:
          case NetworkType.NILE:
            tx = await this.tvmService.sendTransaction(transaction);
            break;
          case NetworkType.SOLANA:
          case NetworkType.SOLANA_DEVNET:
            console.log('Sending SOLANA transaction');
            tx = await this.solanaService.sendTransaction(transaction);
            console.log('txPromise', tx);
            break;
          default:
            tx = await this.evmService.sendTransaction(transaction);
        }

        console.log('tx', tx);
        if (tx.status === TransactionStatus.CONFIRMED) {
          const { code, message } =
            CUSTOM_CODES[CustomCodesEnum.TRANSACTION_CONFIRMED];
          await this.transactionsCache.updateTransaction({
            id,
            data: {
              status: TransactionStatus.CONFIRMED,
              code,
              message,
            },
          });
        }
      } catch (error) {
        this.logger.error(
          `Transaction processing failed: ${error.message}`,
          error.stack,
        );

        this.transactionsCache.updateTransaction({
          id,
          data: {
            status: TransactionStatus.FAILED,
            message: error.message,
            code: error.code,
          },
          useTTL: true,
        });
        throw error;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Transaction processing failed: ${error.message}`,
        error.stack,
      );
    }
  }

  async createTransactionTest(
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    // Generate a unique transaction ID and build the initial transaction data.
    const transactionId = uuidv4();
    const { code, message } = CUSTOM_CODES[CustomCodesEnum.TRANSACTION_CREATED];
    const transactionData: TransactionData = {
      ...createTransactionDto,
      id: transactionId,
      status: TransactionStatus.PENDING_QUEUE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      code,
      message,
    };

    // Save the transaction in cache.
    await this.transactionsCache.setTransaction(transactionId, transactionData);

    // Process the transaction immediately without adding it to a queue.
    try {
      let processedTx: TransactionData;
      switch (transactionData.network) {
        case NetworkType.TRON:
        case NetworkType.NILE:
          processedTx = await this.tvmService.sendTransaction(transactionData);
          break;
        case NetworkType.SOLANA:
        case NetworkType.SOLANA_DEVNET:
          this.logger.log('Sending SOLANA transaction');
          processedTx =
            await this.solanaService.sendTransaction(transactionData);
          break;
        default:
          processedTx = await this.evmService.sendTransaction(transactionData);
      }

      // If the transaction is confirmed, update its status in the cache.
      if (processedTx.status === TransactionStatus.CONFIRMED) {
        const { code: confirmCode, message: confirmMessage } =
          CUSTOM_CODES[CustomCodesEnum.TRANSACTION_CONFIRMED];
        await this.transactionsCache.updateTransaction({
          id: transactionId,
          data: {
            status: TransactionStatus.CONFIRMED,
            code: confirmCode,
            message: confirmMessage,
          },
        });
        // Update local transaction data for the response.
        transactionData.status = TransactionStatus.CONFIRMED;
        transactionData.code = confirmCode;
        transactionData.message = confirmMessage;
        transactionData.hash = processedTx.hash;
      }
    } catch (error) {
      // Log the error and update the transaction status as failed.
      this.logger.error(
        `Transaction processing failed: ${error.message}`,
        error.stack,
      );
      await this.transactionsCache.updateTransaction({
        id: transactionId,
        data: {
          status: TransactionStatus.FAILED,
          message: error.message,
          code: error.code,
        },
        useTTL: true,
      });
      // Reflect the failure in the local transaction data.
      transactionData.status = TransactionStatus.FAILED;
      transactionData.message = error.message;
      transactionData.code = error.code;
    }

    this.transactionsCache.deleteTransaction(transactionId);
    // Return the response DTO based on the (updated) transaction data.
    return TransactionFactory.toResponseDto(transactionData, transactionId);
  }
}
