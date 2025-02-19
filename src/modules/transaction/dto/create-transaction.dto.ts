import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType } from '../../shared/types/network.types';
import { BaseTransactionData } from '../types/transaction.types';
import { TokensEnum } from '../constants/tokens.map';

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
  // @Matches(/^\d+(\.\d{1,2})?$/, {
  //   message: 'Amount must be a valid number string with up to 2 decimal places',
  // })
  amount: string;

  @ApiPropertyOptional({
    description: 'Token to send',
    enum: TokensEnum,
    default: TokensEnum.USDT,
  })
  @IsEnum(TokensEnum)
  @IsOptional()
  token?: TokensEnum;

  @ApiProperty({ enum: NetworkType, description: 'Blockchain network to use' })
  @IsEnum(NetworkType)
  network: NetworkType;
}
