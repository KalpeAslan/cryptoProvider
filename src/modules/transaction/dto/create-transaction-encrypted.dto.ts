import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTransactionEncryptedDto {
  @IsString()
  @ApiProperty({
    description: 'Encrypted data',
    example: 'encrypted_data',
  })
  data: string;
}
