import { Injectable, Logger } from '@nestjs/common';
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

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

@Injectable()
export class EvmService {
  private readonly providers: Map<NetworkType, ethers.JsonRpcProvider>;
  private readonly logger = new Logger(EvmService.name);

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
      this.logger.log(`Initialized provider for network: ${network}`);
    });
  }

  async sendTransaction(params: TransactionParams): Promise<TransactionResult> {
    this.logger.log(`Processing transaction on network: ${params.network}`);
    const provider = this.providers.get(params.network);
    if (!provider) {
      throw new Error(`Provider not found for network ${params.network}`);
    }

    const wallet = new ethers.Wallet(params.privateKey, provider);
    this.logger.log(`Wallet initialized for address: ${wallet.address}`);

    if (params.tokenAddress) {
      this.logger.log(`Initiating token transfer to: ${params.to}`);
      const contract = new ethers.Contract(
        params.tokenAddress,
        ERC20_ABI,
        provider,
      );
      const decimals = await contract.decimals();
      this.logger.log(`Token decimals: ${decimals}`);

      const amountInWei = ethers.parseUnits(params.amount, decimals);
      this.logger.log(
        `Converted token amount ${params.amount} to Wei: ${amountInWei}`,
      );

      return this.sendTokenTransaction({
        wallet,
        to: params.to,
        amount: amountInWei,
        provider,
        tokenAddress: params.tokenAddress,
        gas: params.gas,
        network: params.network,
      });
    }

    const amountInWei = ethers.parseUnits(params.amount, 18);
    this.logger.log(
      `Converted native amount ${params.amount} to Wei: ${amountInWei}`,
    );

    this.logger.log(`Initiating native transfer to: ${params.to}`);
    return this.sendNativeTransaction({
      wallet,
      to: params.to,
      amount: amountInWei,
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
    this.logger.log(`Got nonce for native transaction: ${nonce}`);

    const { gasLimit, gasPrice } =
      await this.evmGasComputingService.computeOptimalGas(
        params.network,
        params.wallet.address,
        params.to,
        params.amount.toString(),
        undefined,
        params.gas,
      );
    this.logger.log(
      `Computed gas parameters - limit: ${gasLimit}, price: ${gasPrice}`,
    );

    const tx: EthersTransaction = await params.wallet.sendTransaction({
      to: params.to,
      value: params.amount,
      nonce,
      gasPrice,
      gasLimit,
    });
    this.logger.log(`Native transaction sent with hash: ${tx.hash}`);

    const receipt: EthersTransactionReceipt | null = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction failed');
    }
    this.logger.log(
      `Native transaction confirmed in block: ${receipt.blockNumber}`,
    );

    return this.formatTransactionResult(tx, params.to);
  }

  private async sendTokenTransaction(
    params: TokenTransactionParams,
  ): Promise<TransactionResult> {
    try {
      this.logger.log(`Initializing token contract at: ${params.tokenAddress}`);
      const contract = new ethers.Contract(
        params.tokenAddress,
        ERC20_TRANSFER_ABI,
        params.wallet,
      );

      const nonce = await params.provider.getTransactionCount(
        params.wallet.address,
      );
      this.logger.log(`Got nonce for token transaction: ${nonce}`);

      const { gasLimit, gasPrice } =
        await this.evmGasComputingService.computeOptimalGas(
          params.network,
          params.wallet.address,
          params.to,
          params.amount.toString(),
          params.tokenAddress,
          params.gas,
        );
      this.logger.log(
        `Computed gas parameters - limit: ${gasLimit}, price: ${gasPrice}`,
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
      this.logger.log(`Token transaction sent with hash: ${tx.hash}`);

      const receipt: EthersTransactionReceipt | null = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction failed: Receipt is null');
      }
      this.logger.log(
        `Token transaction confirmed in block: ${receipt.blockNumber}`,
      );

      return this.formatTransactionResult(
        tx,
        params.tokenAddress,
        params.amount,
      );
    } catch (error) {
      this.logger.error(
        `Token transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private formatTransactionResult(
    tx: EthersTransaction,
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
