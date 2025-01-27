import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType } from '../../shared/types/network.types';
import {
  TransactionStatus,
  TransactionResponse,
} from '../../shared/types/transaction.types';

export class TransactionResponseDto implements TransactionResponse {
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

  @ApiPropertyOptional({ description: 'Additional on-chain transaction data' })
  onChainData?: any;
}
