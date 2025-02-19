import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { IsString } from 'class-validator';

export class DecryptoDto {
  @ApiProperty({
    description: 'Data to decrypt',
    example: 'data',
  })
  @IsString()
  @IsNotEmpty()
  data: string;

  @ApiProperty({
    description: 'Private key for decryption',
    example: 'privateKey',
  })
  @IsString()
  @IsNotEmpty()
  privateKey: string;
}
