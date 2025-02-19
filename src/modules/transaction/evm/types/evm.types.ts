import { ethers } from 'ethers';
import { NetworkType } from '@/modules/shared';
import { TokensEnum } from '../../constants/tokens.map';

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
  token: TokensEnum;
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
