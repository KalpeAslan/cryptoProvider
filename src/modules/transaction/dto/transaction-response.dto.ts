import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType, CUSTOM_CODES } from '../../shared';
import { TransactionStatus } from '../constants/transaction.constants';

export class TransactionResponseDto {
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
  })
  tokenAddress?: string;

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
  @ApiProperty({ description: 'Gas used for the transaction', nullable: true })
  gasUsed: string | null;

  // gasPrice
  @ApiProperty({ description: 'Gas price for the transaction', nullable: true })
  gasPrice: string | null;

  // chainId
  @ApiProperty({ description: 'Chain ID for the transaction' })
  chainId: number;

  // data
  @ApiProperty({ description: 'Data for the transaction', nullable: true })
  data: string | null;

  constructor(transaction: TransactionResponseDto) {
    Object.assign(this, transaction);
  }
}
