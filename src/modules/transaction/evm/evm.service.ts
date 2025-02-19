import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import {
  NetworkType,
  SharedConfig,
  CustomException,
  CustomCode,
  CUSTOM_CODES,
  CustomCodesEnum,
} from '@/modules/shared';
import { TransactionData } from '../types/transaction.types';
import {
  NativeTransactionParams,
  TokenTransactionParams,
} from './types/evm.types';
import { TransactionStatus } from '../constants/transaction.constants';
import { EvmGasComputingService } from './evm-gas-computing.service';
import type { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { ERC20_ABI } from './evm.constants';
import { TOKENS_MAP } from '../constants/tokens.map';
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

  validateTransaction(params: TransactionData): CustomCode {
    if (!params.network) {
      return CUSTOM_CODES[CustomCodesEnum.INVALID_REQUEST];
    }

    const provider = this.providers.get(params.network);
    if (!provider) {
      return CUSTOM_CODES[CustomCodesEnum.PROVIDER_NOT_FOUND];
    }

    if (!params.privateKey) {
      return CUSTOM_CODES[CustomCodesEnum.UNAUTHORIZED];
    }

    if (!params.to || !ethers.isAddress(params.to)) {
      return CUSTOM_CODES[CustomCodesEnum.INVALID_ADDRESS];
    }

    if (
      !params.amount ||
      isNaN(Number(params.amount)) ||
      Number(params.amount) <= 0
    ) {
      return CUSTOM_CODES[CustomCodesEnum.INVALID_REQUEST];
    }

    return CUSTOM_CODES[CustomCodesEnum.SUCCESS];
  }

  // sendTransaction
  async sendTransaction(params: TransactionData): Promise<TransactionData> {
    this.logger.log(`Processing transaction on network: ${params.network}`);

    const validationResult = this.validateTransaction(params);

    if (validationResult.code !== CustomCodesEnum.SUCCESS) {
      throw new CustomException(validationResult.code);
    }

    const provider = this.providers.get(params.network);

    if (
      !params.amount ||
      isNaN(Number(params.amount)) ||
      Number(params.amount) <= 0
    ) {
      throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
    }

    const wallet = new ethers.Wallet(params.privateKey, provider);
    this.logger.log(`Wallet initialized for address: ${wallet.address}`);

    if (params.token) {
      const tokenInfo = TOKENS_MAP[params.network][params.token];

      if (!tokenInfo) {
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }

      this.logger.log(`Initiating token transfer to: ${params.to}`);
      const contract = new ethers.Contract(
        tokenInfo.address,
        ERC20_ABI,
        provider,
      );

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
          provider: provider as ethers.JsonRpcProvider,
          token: params.token,
          network: params.network,
        });
      } catch (error) {
        this.logger.error(
          `Token contract interaction failed: ${error.message}`,
        );
        throw new CustomException(CustomCodesEnum.CONTRACT_CALL_FAILED);
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
        provider: provider as ethers.JsonRpcProvider,
        network: params.network,
      });
    } catch (error) {
      this.logger.error(`Native transaction failed: ${error.message}`);
      throw new CustomException(CustomCodesEnum.TRANSACTION_FAILED);
    }
  }

  private async sendNativeTransaction(
    params: NativeTransactionParams,
  ): Promise<TransactionData> {
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

    const txRequest: TransactionRequest = {
      to: params.to,
      value: params.amount,
      nonce,
      gasLimit,
      gasPrice,
    };

    const tx = await params.wallet.sendTransaction(txRequest);
    this.logger.log(`Native transaction sent with hash: ${tx.hash}`);

    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error('Transaction failed');
    }
    this.logger.log(
      `Native transaction confirmed in block: ${receipt.blockNumber}`,
    );

    const { code, message } = CUSTOM_CODES[CustomCodesEnum.SUCCESS];

    return {
      id: tx.hash,
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      amount: tx.value.toString(),
      network: params.network,
      status: TransactionStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gasPrice: tx.gasPrice?.toString() ?? '0',
      data: tx.data,
      chainId: Number(tx.chainId),
      gasUsed: receipt.gasUsed.toString(),
      code,
      message,
    } as TransactionData;
  }

  private async sendTokenTransaction(
    params: TokenTransactionParams,
  ): Promise<TransactionData> {
    try {
      const tokenInfo = TOKENS_MAP[params.network][params.token];
      if (!tokenInfo) {
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }
      this.logger.log(`Initializing token contract at: ${tokenInfo.address}`);
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
          tokenInfo.address,
          params.gas,
        );
      this.logger.log(
        `Computed gas parameters - limit: ${gasLimit}, price: ${gasPrice}`,
      );

      const iface = new ethers.Interface(ERC20_ABI);
      const data = iface.encodeFunctionData('transfer', [
        params.to,
        params.amount,
      ]);
      const tx = await params.wallet.sendTransaction({
        to: tokenInfo.address,
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

      const { code, message } = CUSTOM_CODES[CustomCodesEnum.SUCCESS];

      return {
        id: tx.hash,
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        amount: params.amount.toString(),
        network: params.network,
        token: params.token,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gasPrice: tx.gasPrice?.toString() ?? '0',
        data: tx.data,
        chainId: Number(tx.chainId),
        gasUsed: receipt.gasUsed.toString(),
        code,
        message,
      } as TransactionData;
    } catch (error) {
      this.logger.error(
        `Token transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  // getTransaction

  async getTransaction(
    txHash: string,
    network: NetworkType,
  ): Promise<TransactionData | null> {
    const provider = this.providers.get(network);
    if (!provider) {
      throw new Error(`Provider not found for network ${network}`);
    }

    const tx = await provider.getTransaction(txHash);
    if (!tx) return null;

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) return null;

    const { code, message } = CUSTOM_CODES[CustomCodesEnum.SUCCESS];

    return {
      id: tx.hash,
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      amount: tx.value.toString(),
      network: network,
      status: TransactionStatus.CONFIRMED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gasPrice: tx.gasPrice?.toString() ?? '0',
      data: tx.data,
      chainId: Number(tx.chainId),
      gasUsed: receipt.gasUsed.toString(),
      code,
      message,
    } as TransactionData;
  }
}
