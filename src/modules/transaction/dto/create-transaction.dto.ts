import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsEthereumAddress,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType } from '../../shared/types/network.types';
import { BaseTransactionData } from '../types/transaction.types';

export class CreateTransactionDto implements BaseTransactionData {
  @ApiProperty({ description: 'Sender address' })
  @IsString()
  // @IsEthereumAddress()
  from: string;

  @ApiProperty({ description: 'Recipient address' })
  @IsString()
  // @IsEthereumAddress()
  to: string;

  @ApiProperty({ description: 'Private key for transaction signing' })
  @IsString()
  privateKey: string;

  @ApiProperty({
    description: 'Amount to send (in wei/smallest unit)',
    default: '1',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Amount must be a valid number string with up to 2 decimal places',
  })
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
