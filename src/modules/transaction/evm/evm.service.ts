import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { NetworkType } from '../../shared/types/network.types';
import { TransactionData } from '../types/transaction.types';
import { SharedConfig } from '../../shared/config/shared.config';
import {
  NativeTransactionParams,
  TokenTransactionParams,
  TransactionResult,
} from './types/evm.types';
import { EvmGasComputingService } from './evm-gas-computing.service';
import { EvmFactory } from './evm.factory';
import { CustomException } from '@/modules/shared/exceptions/custom-error.exception';

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

  async sendTransaction(params: TransactionData): Promise<TransactionResult> {
    this.logger.log(`Processing transaction on network: ${params.network}`);

    if (!params.network) {
      throw new CustomException('INVALID_REQUEST');
    }

    const provider = this.providers.get(params.network);
    if (!provider) {
      throw new CustomException('PROVIDER_NOT_FOUND');
    }

    if (!params.privateKey) {
      throw new CustomException('UNAUTHORIZED');
    }

    if (!params.to || !ethers.isAddress(params.to)) {
      throw new CustomException('INVALID_ADDRESS');
    }

    if (
      !params.amount ||
      isNaN(Number(params.amount)) ||
      Number(params.amount) <= 0
    ) {
      throw new CustomException('INVALID_REQUEST');
    }

    const wallet = new ethers.Wallet(params.privateKey, provider);
    this.logger.log(`Wallet initialized for address: ${wallet.address}`);

    if (params.tokenAddress) {
      if (!ethers.isAddress(params.tokenAddress)) {
        throw new CustomException('INVALID_ADDRESS');
      }

      this.logger.log(`Initiating token transfer to: ${params.to}`);
      const contract = EvmFactory.createContract(params.tokenAddress, provider);

      try {
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
      } catch (error) {
        this.logger.error(
          `Token contract interaction failed: ${error.message}`,
        );
        throw new CustomException('CONTRACT_CALL_FAILED');
      }
    }

    try {
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
    } catch (error) {
      this.logger.error(`Native transaction failed: ${error.message}`);
      throw new CustomException('TRANSACTION_FAILED');
    }
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

    const txRequest = EvmFactory.createNativeTransactionRequest(
      params,
      nonce,
      gasLimit,
      gasPrice,
    );
    const tx = await params.wallet.sendTransaction(txRequest);
    this.logger.log(`Native transaction sent with hash: ${tx.hash}`);

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction failed');
    }
    this.logger.log(
      `Native transaction confirmed in block: ${receipt.blockNumber}`,
    );

    return EvmFactory.formatTransactionResult(tx, receipt, params.to);
  }

  private async sendTokenTransaction(
    params: TokenTransactionParams,
  ): Promise<TransactionResult> {
    try {
      this.logger.log(`Initializing token contract at: ${params.tokenAddress}`);
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

      const data = EvmFactory.createTokenTransferData(params.to, params.amount);
      const tx = await params.wallet.sendTransaction({
        to: params.tokenAddress,
        data,
        nonce,
        gasPrice,
        gasLimit,
      });
      this.logger.log(`Token transaction sent with hash: ${tx.hash}`);

      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Transaction failed: Receipt is null');
      }
      this.logger.log(
        `Token transaction confirmed in block: ${receipt.blockNumber}`,
      );

      return EvmFactory.formatTransactionResult(
        tx,
        receipt,
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

    const receipt = await provider.getTransactionReceipt(txHash);
    return EvmFactory.formatTransactionResult(tx, receipt, tx.to ?? '');
  }
}
