import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import { NetworkType } from '../../shared/types/network.types';
import { TransactionParams } from '../../shared/types/transaction.types';
import { SharedConfig } from '../../shared/config/shared.config';
import {
  NativeTransactionParams,
  TokenTransactionParams,
  TransactionResult,
  ERC20_TRANSFER_ABI,
  EthersTransaction,
  EthersTransactionReceipt,
} from './types/evm.types';
import { EvmGasComputingService } from './evm-gas-computing.service';

@Injectable()
export class EvmService {
  private readonly providers: Map<NetworkType, ethers.JsonRpcProvider>;

  constructor(
    private readonly sharedConfig: SharedConfig,
    private readonly evmGasComputingService: EvmGasComputingService,
  ) {
    this.providers = new Map();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const networks = this.sharedConfig.networks;
    Object.entries(networks).forEach(([network, config]) => {
      this.providers.set(
        network as NetworkType,
        new ethers.JsonRpcProvider(config.rpc),
      );
    });
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    const provider = this.providers.get(params.network);
    if (!provider) {
      throw new Error(`Provider not found for network ${params.network}`);
    }

    const wallet = new ethers.Wallet(params.privateKey, provider);

    if (params.tokenAddress) {
      return this.sendTokenTransaction({
        wallet,
        to: params.to,
        amount: params.amount,
        provider,
        tokenAddress: params.tokenAddress,
        gas: params.gas,
        network: params.network,
      });
    }

    return this.sendNativeTransaction({
      wallet,
      to: params.to,
      amount: params.amount,
      provider,
      gas: params.gas,
      network: params.network,
    });
  }

  private async sendNativeTransaction(
    params: NativeTransactionParams,
  ): Promise<TransactionResult> {
    const nonce = await params.provider.getTransactionCount(
      params.wallet.address,
    );

    const { gasLimit, gasPrice } =
      await this.evmGasComputingService.computeOptimalGas(
        params.network,
        params.wallet.address,
        params.to,
        params.amount,
        undefined,
        params.gas,
      );

    const tx: EthersTransaction = await params.wallet.sendTransaction({
      to: params.to,
      value: params.amount,
      nonce,
      gasPrice,
      gasLimit,
    });

    const receipt: EthersTransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return this.formatTransactionResult(tx, params.to);
  }

  private async sendTokenTransaction(
    params: TokenTransactionParams,
  ): Promise<TransactionResult> {
    const contract = new ethers.Contract(
      params.tokenAddress,
      ERC20_TRANSFER_ABI,
      params.wallet,
    );

    const nonce = await params.provider.getTransactionCount(
      params.wallet.address,
    );

    const { gasLimit, gasPrice } =
      await this.evmGasComputingService.computeOptimalGas(
        params.network,
        params.wallet.address,
        params.to,
        params.amount,
        params.tokenAddress,
        params.gas,
      );

    const tx: EthersTransaction = (await contract.transfer(
      params.to,
      params.amount,
      {
        nonce,
        gasPrice,
        gasLimit,
      },
    )) as EthersTransaction;

    const receipt: EthersTransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction failed');
    }

    return this.formatTransactionResult(tx, params.tokenAddress, params.amount);
  }

  private formatTransactionResult(
    tx: EthersTransaction,
    to: string,
    value?: string,
  ): TransactionResult {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? to,
      value: value ?? tx.value.toString(),
      nonce: tx.nonce,
      gasPrice: tx.gasPrice?.toString() ?? '0',
      data: tx.data,
      chainId: Number(tx.chainId),
    };
  }

  async getTransaction(
    txHash: string,
    network: NetworkType,
  ): Promise<TransactionResult | null> {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`Provider not found for network ${network}`);
    }

    const tx = await provider.getTransaction(txHash);
    if (!tx) return null;

    return this.formatTransactionResult(tx, tx.to ?? '');
  }
}
