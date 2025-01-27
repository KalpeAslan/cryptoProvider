import { ethers } from 'ethers';
import {
  NativeTransactionParams,
  TransactionResult,
  EthersTransaction,
  EthersTransactionReceipt,
} from './types/evm.types';

export class EvmFactory {
  private static readonly ERC20_ABI = [
    'function decimals() view returns (uint8)',
    'function transfer(address to, uint256 amount) returns (bool)',
  ];

  static createNativeTransactionRequest(
    params: NativeTransactionParams,
    nonce: number,
    gasLimit: bigint,
    gasPrice: bigint,
  ): ethers.TransactionRequest {
    return {
      to: params.to,
      value: params.amount,
      nonce,
      gasPrice,
      gasLimit,
    };
  }

  static createTokenTransferData(to: string, amount: string | bigint): string {
    const iface = new ethers.Interface(this.ERC20_ABI);
    return iface.encodeFunctionData('transfer', [to, amount]);
  }

  static createContract(
    tokenAddress: string,
    signerOrProvider: ethers.Wallet | ethers.Provider,
  ): ethers.Contract {
    return new ethers.Contract(tokenAddress, this.ERC20_ABI, signerOrProvider);
  }

  static formatTransactionResult(
    tx: EthersTransaction,
    receipt: EthersTransactionReceipt | null,
    to: string,
    value?: string | bigint,
  ): TransactionResult {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? to,
      value: (value ?? tx.value).toString(),
      nonce: tx.nonce,
      gasPrice: tx.gasPrice?.toString() ?? '0',
      data: tx.data,
      chainId: Number(tx.chainId),
      gasUsed: receipt?.gasUsed?.toString() ?? '0',
    };
  }
}
