import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType } from '../../shared/types/network.types';
import { BaseTransactionData } from '../../shared/types/transaction.types';

export class CreateTransactionDto implements BaseTransactionData {
  @ApiProperty({ description: 'Sender address' })
  @IsString()
  from: string;

  @ApiProperty({ description: 'Recipient address' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Private key for transaction signing' })
  @IsString()
  privateKey: string;

  @ApiProperty({ description: 'Amount to send (in wei/smallest unit)' })
  @IsString()
  amount: string;

  @ApiPropertyOptional({
    description: 'Token contract address for ERC20 transfers',
  })
  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Gas limit for the transaction',
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  gas?: number;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network to use' })
  @IsEnum(NetworkType)
  network: NetworkType;
}
