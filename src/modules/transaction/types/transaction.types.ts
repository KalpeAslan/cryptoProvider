import { CustomCode, NetworkType } from '@/modules/shared';
import { TransactionStatus } from '../constants/transaction.constants';
import { TokensEnum } from '../constants/tokens.map';
export interface BaseTransactionData {
  from: string;
  to: string;
  amount: string;
  network: NetworkType;
  token?: TokensEnum;
}
interface TransactionParams extends BaseTransactionData {
  privateKey: string;
}

export interface TransactionData extends TransactionParams, CustomCode {
  id?: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  hash?: string;
  data?: string;
  gasUsed?: string;
  gasPrice?: string;
  chainId?: number;
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
