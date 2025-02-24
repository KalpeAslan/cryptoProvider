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
} from '@solana/spl-token';
import {
  NetworkType,
  SharedConfig,
  CustomException,
  CUSTOM_CODES,
  CustomCodesEnum,
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
    this.logger.log(
      `Transaction details - To: ${dto.to}, Amount: ${dto.amount}${dto.token ? `, Token: ${dto.token}` : ''}`,
    );

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
      this.logger.log(
        `Initiating native SOL transfer of ${amount} SOL to ${to}`,
      );
      // Create a keypair from the private key
      const fromKeypair = this.generateKeypair(privateKey);
      this.logger.log(`Sender public key: ${fromKeypair.publicKey.toString()}`);
      const toPublicKey = new PublicKey(to);

      // Convert amount to lamports
      const amountInLamports = Math.floor(
        parseFloat(amount) * LAMPORTS_PER_SOL,
      );
      this.logger.log(`Amount in lamports: ${amountInLamports}`);

      const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      this.logger.log(`Retrieved recent blockhash: ${recentBlockhash}`);

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
      this.logger.log('Sending transaction for confirmation...');
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
      );
      this.logger.log(`Transaction confirmed with signature: ${signature}`);

      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

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
      this.logger.log(
        `Initiating token transfer of ${amount} ${token} to ${to}`,
      );
      const tokenInfo = TOKENS_MAP[network][token!];
      if (!tokenInfo) {
        this.logger.error(
          `Token ${token} not found in token map for network ${network}`,
        );
        throw new CustomException(CustomCodesEnum.INVALID_REQUEST);
      }
      this.logger.log(`Token info found: ${JSON.stringify(tokenInfo)}`);

      // Create keypair from private key
      const fromKeypair = this.generateKeypair(privateKey);
      this.logger.log(`Sender public key: ${fromKeypair.publicKey.toString()}`);
      const toPublicKey = new PublicKey(to);
      const mintPublicKey = new PublicKey(tokenInfo.address);

      // Get associated token accounts for sender and receiver
      this.logger.log('Deriving associated token accounts...');
      const fromATA = await getAssociatedTokenAddress(
        mintPublicKey,
        fromKeypair.publicKey,
      );
      const toATA = await getAssociatedTokenAddress(mintPublicKey, toPublicKey);
      this.logger.log(`Sender ATA: ${fromATA.toString()}`);
      this.logger.log(`Receiver ATA: ${toATA.toString()}`);

      // Create transaction
      const transaction = new Transaction();

      // Check if receiver's token account exists, if not add creation instruction
      const toAccount = await connection.getAccountInfo(toATA);
      if (!toAccount) {
        this.logger.log(
          'Receiver token account does not exist, adding creation instruction',
        );
        transaction.add(
          createAssociatedTokenAccountInstruction(
            fromKeypair.publicKey,
            toATA,
            toPublicKey,
            mintPublicKey,
          ),
        );
      }

      const decimals = tokenInfo.decimals;

      // Add transfer instruction
      const amountBigInt = BigInt(amount) * BigInt(10 ** decimals);
      transaction.add(
        createTransferInstruction(
          fromATA,
          toATA,
          fromKeypair.publicKey,
          amountBigInt,
        ),
      );

      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      // Send and confirm transaction
      this.logger.log('Sending token transaction for confirmation...');
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromKeypair],
      );
      this.logger.log(
        `Token transaction confirmed with signature: ${signature}`,
      );

      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      const fee = tx?.meta?.fee;

      return {
        hash: signature,
        from: fromKeypair.publicKey.toString(),
        to,
        amount: amount.toString(),
        network,
        token,
        status: TransactionStatus.CONFIRMED,
        createdAt: new Date().toISOString(),
        gasPrice: fee?.toString() || '0',
        gasUsed: '0',
        code: CustomCodesEnum.SUCCESS,
        message: 'Transaction confirmed successfully',
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
    this.logger.log(
      `Fetching transaction details for signature: ${signature} on network: ${network}`,
    );
    const connection = this.providers.get(network)!;

    try {
      console.log('signature', signature);
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) return null;

      const status: TransactionStatus = this.mapTransactionStatus(
        tx.meta?.err ? 'FAILED' : 'SUCCESS',
      );

      return {
        hash: signature,
        network,
        status,
        data: tx?.transaction.message.compiledInstructions.toString(),
        gasUsed: tx?.meta?.fee.toString(),
      } as TransactionData;
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      return null;
    }
  }

  private generateKeypair(privateKey: string): Keypair {
    const keypairBytes = bs58.default.decode(privateKey);
    return Keypair.fromSecretKey(keypairBytes);
  }
}
