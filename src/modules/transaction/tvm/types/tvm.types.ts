import { TronWeb } from 'tronweb';
import { NetworkType } from '@core/shared';

export interface NativeTransactionParams {
  wallet: TronWeb;
  from: string;
  to: string;
  amount: string | bigint;
  network: NetworkType;
}

export interface TokenTransactionParams {
  wallet: TronWeb;
  from: string;
  to: string;
  amount: string | bigint;
  tokenAddress: string;
  network: NetworkType;
}
