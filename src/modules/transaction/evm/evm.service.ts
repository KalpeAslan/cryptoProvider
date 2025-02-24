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
import { TransactionStatus } from '../constants/transaction.constants';
import { EvmGasComputingService } from './evm-gas-computing.service';
import type { TransactionRequest } from 'ethers/src.ts/providers/provider';
import { ERC20_ABI } from './evm.constants';
import { TOKENS_MAP } from '../constants/tokens.map';
import { AbstractOnchainService } from '../base/abstract-onchain.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';

@Injectable()
export class EvmService extends AbstractOnchainService {
  private readonly logger = new Logger(EvmService.name);
  private readonly providers: Map<NetworkType, ethers.JsonRpcProvider>;

  constructor(
    private readonly sharedConfig: SharedConfig,
    private readonly evmGasComputingService: EvmGasComputingService,
  ) {
    super();
    this.providers = new Map();
    this.initializeProviders();
  }

  protected initializeProviders(): void {
    const networks = this.sharedConfig.networks;
    Object.entries(networks).forEach(([network, config]) => {
      this.providers.set(
        network as NetworkType,
        new ethers.JsonRpcProvider(config.rpc),
      );
      this.logger.log(`Initialized provider for network: ${network}`);
    });
  }

  validateTransaction(dto: CreateTransactionDto): CustomCode {
    if (!ethers.isAddress(dto.to)) {
      return CUSTOM_CODES[CustomCodesEnum.INVALID_ADDRESS];
    }
    return CUSTOM_CODES[CustomCodesEnum.SUCCESS];
  }

  // sendTransaction
  async sendTransaction(dto: CreateTransactionDto): Promise<TransactionData> {
    this.logger.log(`Processing transaction on network: ${dto.network}`);

    await this.validateTransactionOrThrow(dto);

    try {
      const isTokenTx = !!dto.token;
      return isTokenTx
        ? await this.sendTokenTransaction(dto)
        : await this.sendNativeTransaction(dto);
    } catch (error) {
      const isTokenTx = !!dto.token;
      this.logger.error(
        `${isTokenTx ? 'Token' : 'Native'} transaction failed: ${error.message}`,
      );
      throw new CustomException(
        isTokenTx
          ? CustomCodesEnum.CONTRACT_CALL_FAILED
          : CustomCodesEnum.TRANSACTION_FAILED,
      );
    }
  }

  private async validateTransactionOrThrow(
    dto: CreateTransactionDto,
  ): Promise<void> {
    const validationResult = this.validateTransaction(dto);
    if (validationResult.code !== CustomCodesEnum.SUCCESS) {
      throw new CustomException(validationResult.code);
    }
  }

  async sendNativeTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionData> {
    const amountInWei = ethers.parseUnits(dto.amount, 18);
    this.logger.log(
      `Converted native amount ${dto.amount} to Wei: ${amountInWei}`,
    );

    this.logger.log(`Initiating native transfer to: ${dto.to}`);

    const provider = this.providers.get(dto.network)!;
    const wallet = new ethers.Wallet(dto.privateKey, provider);
    this.logger.log(`Wallet initialized for address: ${wallet.address}`);

    const nonce = await provider.getTransactionCount(wallet.address);
    this.logger.log(`Got nonce for native transaction: ${nonce}`);

    const { gasLimit, gasPrice } =
      await this.evmGasComputingService.computeOptimalGas(
        dto.network,
        wallet.address,
        dto.to,
        amountInWei.toString(),
      );
    this.logger.log(
      `Computed gas parameters - limit: ${gasLimit}, price: ${gasPrice}`,
    );

    const txRequest: TransactionRequest = {
      to: dto.to,
      value: amountInWei,
      nonce,
      gasLimit,
      gasPrice,
    };

    const tx = await wallet.sendTransaction(txRequest);
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
      network: dto.network,
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

  async sendTokenTransaction(
    params: CreateTransactionDto,
  ): Promise<TransactionData> {
    const provider = this.providers.get(params.network)!;

    const wallet = new ethers.Wallet(params.privateKey, provider);
    this.logger.log(`Wallet initialized for address: ${wallet.address}`);
    const tokenInfo = TOKENS_MAP[params.network][params.token!];

    if (!tokenInfo) {
      throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
    }

    this.logger.log(`Initiating token transfer to: ${params.to}`);
    const contract = new ethers.Contract(
      tokenInfo.address,
      ERC20_ABI,
      provider,
    );

    const decimals = await contract.decimals(); // #TODO: store decimals in the tokenInfo object
    this.logger.log(`Token decimals: ${decimals}`);

    const amountInWei = ethers.parseUnits(params.amount, decimals);
    this.logger.log(
      `Converted token amount ${params.amount} to Wei: ${amountInWei}`,
    );

    try {
      if (!tokenInfo) {
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }
      this.logger.log(`Initializing token contract at: ${tokenInfo.address}`);
      const nonce = await provider.getTransactionCount(wallet.address);
      this.logger.log(`Got nonce for token transaction: ${nonce}`);

      const { gasLimit, gasPrice } =
        await this.evmGasComputingService.computeOptimalGas(
          params.network,
          wallet.address,
          params.to,
          params.amount.toString(),
          tokenInfo.address,
        );
      this.logger.log(
        `Computed gas parameters - limit: ${gasLimit}, price: ${gasPrice}`,
      );

      const iface = new ethers.Interface(ERC20_ABI);
      const data = iface.encodeFunctionData('transfer', [
        params.to,
        params.amount,
      ]);
      const tx = await wallet.sendTransaction({
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
    const provider = this.providers.get(network)!;

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
