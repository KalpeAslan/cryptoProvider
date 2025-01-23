import { NetworkType } from './network.types';

export enum TransactionStatus {
  PENDING_QUEUE = 'PENDING_QUEUE',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

export interface BaseTransactionData {
  from: string;
  to: string;
  amount: string;
  network: NetworkType;
  tokenAddress?: string;
  gas?: number;
}

export interface TransactionParams extends BaseTransactionData {
  privateKey: string;
}

export interface TransactionData extends TransactionParams {
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  onChainTxHash?: string;
  onChainData?: any;
}

export interface TransactionResponse
  extends Omit<TransactionData, 'privateKey'> {
  hash: string;
}

export interface TransactionConfirmationJob {
  hash: string;
  txHash: string;
  network: NetworkType;
}

export interface ProcessTransactionJob extends TransactionParams {
  hash: string;
}
