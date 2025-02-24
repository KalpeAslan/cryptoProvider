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
import { TransactionStatus } from '../constants/transaction.constants';
import { TvmGasComputingService } from './tvm-gas-computing.service';
import { HttpProvider as HttpProviderType } from 'tronweb/lib/esm/lib/providers';
import { ethers } from 'ethers';
import { TOKENS_MAP } from '../constants/tokens.map';
import { AbstractOnchainService } from '../base/abstract-onchain.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
const HttpProvider = providers.HttpProvider;

@Injectable()
export class TvmService extends AbstractOnchainService {
  private readonly logger = new Logger(TvmService.name);
  private readonly providers: Map<NetworkType, HttpProviderType>;

  constructor(
    private readonly sharedConfig: SharedConfig,
    private readonly tvmGasComputingService: TvmGasComputingService,
  ) {
    super();
    this.providers = new Map();
    this.initializeProviders();
  }

  protected initializeProviders(): void {
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

  async sendTransaction(dto: TransactionData): Promise<TransactionData> {
    const isTokenTx = !!dto.token;

    try {
      if (isTokenTx) {
        return await this.sendTokenTransaction(dto);
      }
      return await this.sendNativeTransaction(dto);
    } catch (error) {
      this.logger.error(`Failed to send transaction: ${error.message}`);
      throw new CustomException(CustomCodesEnum.TRANSACTION_FAILED);
    }
  }

  async sendNativeTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionData> {
    const { from, to, privateKey, amount, network } = dto;
    const provider = this.providers.get(network)!;

    const wallet = new TronWeb(provider, provider, provider, privateKey);

    try {
      const convertedAmount = ethers.parseUnits(String(dto), 6);
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

  async sendTokenTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionData> {
    const { from, to, privateKey, token, amount, network } = dto;

    const provider = this.providers.get(network)!;

    const wallet = new TronWeb(provider, provider, provider, privateKey);

    const tokenInfo = TOKENS_MAP[network][token!];

    if (!tokenInfo) {
      throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
    }

    try {
      const tokenInfo = TOKENS_MAP[network][token!];
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
    })!;

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
}
