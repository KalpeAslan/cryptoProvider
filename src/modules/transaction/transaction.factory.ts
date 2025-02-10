import { TransactionData } from './types/transaction.types';
import { TransactionResponseDto } from './dto/transaction-response.dto';

export class TransactionFactory {
  public static toResponseDto(
    data: TransactionData,
    id: string,
  ): TransactionResponseDto {
    return new TransactionResponseDto({
      ...data,
      id,
      gasUsed: data.gasUsed ?? undefined,
      gasPrice: data.gasPrice ?? undefined,
      chainId: data.chainId ?? undefined,
      data: data.data ?? undefined,
    });
  }
}
