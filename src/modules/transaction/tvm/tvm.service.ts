import { Injectable, Logger } from '@nestjs/common';
import { TronWeb, providers } from 'tronweb';
import {
  NetworkType,
  SharedConfig,
  CustomException,
  CUSTOM_CODES,
  CustomCodesEnum,
} from '@/modules/shared';
import { TransactionData } from '../types/transaction.types';
import {
  NativeTransactionParams,
  TokenTransactionParams,
} from './types/tvm.types';
import { TransactionStatus } from '../constants/transaction.constants';
import { TvmGasComputingService } from './tvm-gas-computing.service';
import { HttpProvider as HttpProviderType } from 'tronweb/lib/esm/lib/providers';
import { ethers } from 'ethers';
import { TOKENS_MAP } from '../constants/tokens.map';
const HttpProvider = providers.HttpProvider;

@Injectable()
export class TvmService {
  private readonly providers: Map<NetworkType, HttpProviderType>;
  private readonly logger = new Logger(TvmService.name);

  constructor(
    private readonly sharedConfig: SharedConfig,
    private readonly tvmGasComputingService: TvmGasComputingService,
  ) {
    this.providers = new Map();
    this.initializeTronWeb();
  }

  private initializeTronWeb(): void {
    const tronWeb = new TronWeb({
      fullHost: this.sharedConfig.networks.tron.rpc,
    });

    const nileWeb = new TronWeb({
      fullHost: this.sharedConfig.networks.nile.rpc,
    });

    this.providers.set(
      NetworkType.TRON,
      new HttpProvider(this.sharedConfig.networks.tron.rpc),
    );
    this.providers.set(
      NetworkType.NILE,
      new HttpProvider(this.sharedConfig.networks.nile.rpc),
    );
    this.logger.log(`Initialized TronWeb for network: ${NetworkType.TRON}`);
  }

  validateTransaction(params: TransactionData): CustomCodesEnum {
    if (!params.network) {
      return CustomCodesEnum.INVALID_REQUEST;
    }

    const tronWeb = this.providers.get(params.network);
    if (!tronWeb) {
      return CustomCodesEnum.PROVIDER_NOT_FOUND;
    }

    return CustomCodesEnum.SUCCESS;
  }

  async sendTransaction(params: TransactionData): Promise<TransactionData> {
    const { from, to, privateKey, token, amount, network } = params;
    const validationResult = this.validateTransaction(params);
    if (validationResult !== CustomCodesEnum.SUCCESS) {
      throw new CustomException(validationResult);
    }

    const provider = this.providers.get(network)!;

    const wallet = new TronWeb(provider, provider, provider, privateKey);

    try {
      if (token) {
        const tokenInfo = TOKENS_MAP[network][token];
        if (!tokenInfo) {
          throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
        }
        return await this.sendTokenTransaction({
          wallet,
          to,
          amount,
          token,
          network,
          from,
        });
      }
      return await this.sendNativeTransaction({
        wallet,
        to,
        amount,
        network,
        from,
      });
    } catch (error) {
      this.logger.error(`Failed to send transaction: ${error.message}`);
      throw new CustomException(CustomCodesEnum.TRANSACTION_FAILED);
    }
  }

  private async sendNativeTransaction({
    wallet,
    to,
    amount,
    from,
  }: NativeTransactionParams): Promise<TransactionData> {
    try {
      const convertedAmount = ethers.parseUnits(String(amount), 6);
      const tx = await wallet.trx.sendTransaction(to, Number(convertedAmount));
      return {
        hash: tx.txid,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...CUSTOM_CODES[CustomCodesEnum.SUCCESS],
        from,
        to,
        amount,
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Native transaction failed: ${error.message}`);
      throw error;
    }
  }

  private async sendTokenTransaction({
    wallet,
    from,
    to,
    token,
    amount,
    network,
  }: TokenTransactionParams): Promise<TransactionData> {
    try {
      const tokenInfo = TOKENS_MAP[network][token];
      if (!tokenInfo) {
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }
      const contract = await wallet.contract().at(tokenInfo.address);
      const decimals = await contract.decimals().call();
      const convertedAmount = ethers.parseUnits(String(amount), decimals);
      const hash = await contract.transfer(to, convertedAmount).send();

      return {
        hash,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...CUSTOM_CODES[CustomCodesEnum.SUCCESS],
        from,
        to,
        amount: amount.toString(),
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Token transaction failed: ${error.message}`);
      throw error;
    }
  }

  async getTransaction(
    txHash: string,
    network: NetworkType,
  ): Promise<TransactionData | null> {
    const tronWeb = new TronWeb({
      fullHost: this.providers.get(network)!.host,
    });

    if (!tronWeb) {
      throw new CustomException(CustomCodesEnum.PROVIDER_NOT_FOUND);
    }

    try {
      const tx = await tronWeb.trx.getTransaction(txHash);
      if (!tx) return null;

      return {
        hash: txHash,
        network,
        status: this.mapTransactionStatus(tx.ret[0].contractRet),
        from: tronWeb.address.fromHex(
          tx.raw_data.contract[0].parameter.value.owner_address,
        ),
        // to: tronWeb.address.fromHex(
        //   tx.raw_data.contract[0].parameter.value.to_address,
        // ),
        // amount: tronWeb.fromSun(tx.raw_data.contract[0].parameter.value.amount),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // gasPrice: tx.raw_data.contract[0].parameter.value.fee,
        // gasUsed: tx.raw_data.contract[0].parameter.value.energy_used,
        // data: tx.raw_data.contract[0].parameter.value.data,
        ...CUSTOM_CODES[CustomCodesEnum.SUCCESS],
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return null;
    }
  }

  private mapTransactionStatus(status: string): TransactionStatus {
    switch (status) {
      case 'SUCCESS':
        return TransactionStatus.CONFIRMED;
      case 'FAILED':
        return TransactionStatus.FAILED;
      default:
        return TransactionStatus.PENDING_CONFIRMATION;
    }
  }
}
