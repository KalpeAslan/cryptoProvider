import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export class TransactionFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  walletAddress?: string;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
