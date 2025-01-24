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
  id: string;
}

export interface TransactionConfirmationJob {
  id: string;
  txHash: string;
  network: NetworkType;
}

export interface ProcessTransactionJob extends TransactionParams {
  id: string;
}

export interface PendingTransactionCheckJob {
  timestamp: number;
}

export interface Transaction {
  hash: string;
  networkTxHash?: string;
  status: TransactionStatus;
  from: string;
  to: string;
  amount: string;
  network: string;
  tokenAddress?: string;
  createdAt: number;
  updatedAt: number;
}
