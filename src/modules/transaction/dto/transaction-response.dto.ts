import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType, CUSTOM_CODES } from '../../shared';
import { TransactionStatus } from '../constants/transaction.constants';
import { TransactionData } from '../types/transaction.types';

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
    Object.assign(this, transaction);
  }
}
