import { Injectable, Logger } from '@nestjs/common';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  NetworkType,
  SharedConfig,
  CustomException,
  CUSTOM_CODES,
  CustomCodesEnum,
  CustomCode,
} from '@/modules/shared';
import { TransactionData } from '../types/transaction.types';
import { TransactionStatus } from '../constants/transaction.constants';
import { TOKENS_MAP } from '../constants/tokens.map';
import { AbstractOnchainService } from '../base/abstract-onchain.service';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import * as bs58 from 'bs58';

@Injectable()
export class SolanaService extends AbstractOnchainService {
  private readonly logger = new Logger(SolanaService.name);
  private readonly providers: Map<NetworkType, Connection>;

  constructor(private readonly sharedConfig: SharedConfig) {
    super();
    this.providers = new Map();
    this.initializeProviders();
  }

  protected initializeProviders(): void {
    const networks = this.sharedConfig.networks;
    Object.entries(networks).forEach(([network, config]) => {
      if (network.startsWith('solana')) {
        this.providers.set(
          network as NetworkType,
          new Connection(config.rpc, {
            commitment: 'confirmed',
          }),
        );
        this.logger.log(
          `Initialized Solana connection for network: ${network}`,
        );
      }
    });
  }

  async sendTransaction(dto: CreateTransactionDto): Promise<TransactionData> {
    this.logger.log(`Processing transaction on network: ${dto.network}`);

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

  async sendNativeTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionData> {
    const { to, privateKey, amount, network } = dto;
    const connection = this.providers.get(network)!;

    try {
      // Create a keypair from the private key
      const keypairBytes = bs58.default.decode(privateKey);
      const fromKeypair = Keypair.fromSecretKey(keypairBytes);
      const toPublicKey = new PublicKey(to);

      // Convert amount to lamports
      const amountInLamports = Math.floor(
        parseFloat(amount) * LAMPORTS_PER_SOL,
      );

      const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      console.log('recentBlockhash', recentBlockhash);

      const instruction = SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amountInLamports,
      });

      const transaction = new Transaction();

      transaction.add(instruction);
      transaction.recentBlockhash = recentBlockhash;

      transaction.sign(fromKeypair);

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
      );

      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      console.log('tx', tx);

      const fee = tx?.meta?.fee;
      const status = tx?.meta?.err
        ? CustomCodesEnum.TRANSACTION_FAILED
        : CustomCodesEnum.TRANSACTION_CONFIRMED;

      const { code, message } = CUSTOM_CODES[status];

      return {
        hash: signature,
        from: fromKeypair.publicKey.toString(),
        to,
        amount: amount.toString(),
        network,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        code,
        gasPrice: fee?.toString() || '0',
        message,
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Native transaction failed: ${error.message}`);
      throw error;
    }
  }

  async sendTokenTransaction(
    dto: CreateTransactionDto,
  ): Promise<TransactionData> {
    const { to, privateKey, token, amount, network } = dto;
    const connection = this.providers.get(network)!;

    try {
      const tokenInfo = TOKENS_MAP[network][token!];
      if (!tokenInfo) {
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }

      // Create keypair from private key
      const fromKeypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
      const toPublicKey = new PublicKey(to);
      const mintPublicKey = new PublicKey(tokenInfo.address);

      // Get associated token accounts for sender and receiver
      const fromATA = await getAssociatedTokenAddress(
        mintPublicKey,
        fromKeypair.publicKey,
      );
      const toATA = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);

      // Create transaction
      const transaction = new Transaction();

      // Check if receiver's token account exists, if not add creation instruction
      const toAccount = await connection.getAccountInfo(toATA);
      if (!toAccount) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromKeypair.publicKey,
            toATA,
            toPublicKey,
            mintPublicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      // Add transfer instruction
      const amountBigInt = BigInt(amount);
      transaction.add(
        createTransferInstruction(
          fromATA,
          toATA,
          fromKeypair.publicKey,
          amountBigInt,
        ),
      );

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
      );

      const { code, message } = CUSTOM_CODES[CustomCodesEnum.SUCCESS];

      return {
        hash: signature,
        from: fromKeypair.publicKey.toString(),
        to,
        amount: amount.toString(),
        network,
        token,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gasPrice: '0',
        gasUsed: '0',
        code,
        message,
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Token transaction failed: ${error.message}`);
      throw error;
    }
  }

  async getTransaction(
    signature: string,
    network: NetworkType,
  ): Promise<TransactionData | null> {
    const connection = this.providers.get(network);
    if (!connection) {
      throw new CustomException(CustomCodesEnum.PROVIDER_NOT_FOUND);
    }

    try {
      const tx = await connection.getTransaction(signature);
      if (!tx) return null;

      const { code, message } = CUSTOM_CODES[CustomCodesEnum.SUCCESS];

      return {
        hash: signature,
        network,
        status: this.mapTransactionStatus(tx.meta?.err ? 'FAILED' : 'SUCCESS'),
        from: tx.transaction.message.accountKeys[0].toString(),
        to: tx.transaction.message.accountKeys[1].toString(),
        amount: (
          (tx.meta?.postBalances?.[1] ?? 0) - (tx.meta?.preBalances?.[1] ?? 0)
        ).toString(),
        createdAt: tx.blockTime?.toString() || new Date().toISOString(),
        gasPrice: tx.meta?.fee.toString() || '0',
        gasUsed: '0', // Solana doesn't have a direct gas used concept
        code,
        message,
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return null;
    }
  }
}
