import { ethers } from 'ethers';
import { NetworkType } from '@core/shared';

export interface NativeTransactionParams {
  wallet: ethers.Wallet;
  to: string;
  amount: string | bigint;
  provider: ethers.JsonRpcProvider;
  gas?: number;
  network: NetworkType;
}

export interface TokenTransactionParams {
  wallet: ethers.Wallet;
  to: string;
  amount: string | bigint;
  provider: ethers.JsonRpcProvider;
  tokenAddress: string;
  gas?: number;
  network: NetworkType;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  nonce: number;
  gasPrice: string;
  data: string;
  chainId: number;
  gasUsed: string;
}
