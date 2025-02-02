import { CustomCode, NetworkType } from '@core/shared';
import { TransactionStatus } from '../constants/transaction.constants';

export interface BaseTransactionData {
  from: string;
  to: string;
  amount: string;
  network: NetworkType;
  tokenAddress?: string;
  gas?: number;
}
interface TransactionParams extends BaseTransactionData {
  privateKey: string;
}

export interface TransactionData extends TransactionParams, CustomCode {
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  hash?: string;
  // onChainData?: any;
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

export interface UpdateTransactionParams {
  id: string;
  data: Partial<TransactionData>;
  useTTL?: boolean;
}
