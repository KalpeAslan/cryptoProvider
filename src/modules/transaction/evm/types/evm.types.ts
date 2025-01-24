import { ethers } from 'ethers';
import { NetworkType } from '../../../shared/types/network.types';

export interface EvmNetworkConfig {
  rpc: string;
  chainId: number;
  provider: ethers.JsonRpcProvider;
}

export type EvmNetworkMap = Record<NetworkType, EvmNetworkConfig>;

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
  confirmations?: number;
}

export type EthersTransaction = ethers.TransactionResponse;
export type EthersTransactionReceipt = ethers.TransactionReceipt;

export interface Erc20TransferTransaction {
  hash: string;
  from: string;
  to: string;
  data: string;
  nonce: number;
  gasPrice: bigint;
  chainId: number;
}

export const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
] as const;
