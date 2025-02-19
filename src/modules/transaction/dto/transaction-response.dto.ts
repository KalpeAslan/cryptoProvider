import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType, CUSTOM_CODES } from '../../shared';
import { TransactionStatus } from '../constants/transaction.constants';
import { TransactionData } from '../types/transaction.types';
import { TokensEnum } from '../constants/tokens.map';

export class TransactionResponseDto
  implements Omit<TransactionData, 'privateKey'>
{
  @ApiProperty({ description: 'Transaction ID (UUID)' })
  id: string;

  @ApiProperty({ description: 'Sender address' })
  from: string;

  @ApiProperty({ description: 'Recipient address' })
  to: string;

  @ApiProperty({ description: 'Amount sent (in wei/smallest unit)' })
  amount: string;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network used' })
  network: NetworkType;

  @ApiPropertyOptional({
    description: 'Token contract address for ERC20 transfers',
    enum: TokensEnum,
  })
  token?: TokensEnum;

  @ApiProperty({
    enum: TransactionStatus,
    description: 'Current transaction status',
  })
  status: TransactionStatus;

  @ApiProperty({ description: 'Transaction creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last transaction update timestamp' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'On-chain transaction hash' })
  hash?: string;

  // @ApiPropertyOptional({ description: 'Additional on-chain transaction data' })
  // onChainData?: any;

  @ApiProperty({
    enum: CUSTOM_CODES,
    description: 'Custom code for the transaction',
  })
  code: number;

  @ApiProperty({ description: 'Custom message for the transaction' })
  message: string;

  // gasUser
  @ApiPropertyOptional({ description: 'Gas used for the transaction' })
  gasUsed?: string;

  // gasPrice
  @ApiPropertyOptional({ description: 'Gas price for the transaction' })
  gasPrice?: string;

  // chainId
  @ApiPropertyOptional({ description: 'Chain ID for the transaction' })
  chainId?: number;

  // data
  @ApiPropertyOptional({ description: 'Data for the transaction' })
  data?: string;

  @ApiPropertyOptional({ description: 'Gas limit for the transaction' })
  gas?: number;

  constructor(transaction: Partial<TransactionResponseDto>) {
    this.id = transaction.id as string;
    this.from = transaction.from as string;
    this.to = transaction.to as string;
    this.amount = transaction.amount as string;
    this.network = transaction.network as NetworkType;
    this.status = transaction.status as TransactionStatus;
    this.createdAt = transaction.createdAt as string;
    this.updatedAt = transaction.updatedAt as string;
    this.hash = transaction.hash as string;
    this.code = transaction.code as number;
    this.message = transaction.message as string;
    this.gasUsed = transaction.gasUsed as string;
    this.gasPrice = transaction.gasPrice as string;
    this.chainId = transaction.chainId as number;
    this.data = transaction.data as string;
    this.gas = transaction.gas as number;
    this.token = transaction.token as TokensEnum;
  }
}
