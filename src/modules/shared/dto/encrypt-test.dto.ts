import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

import { IsString } from 'class-validator';

export class EncryptTestDto {
  @ApiProperty({
    description: 'Data to encrypt',
    example: { key: 'value' },
    type: 'object',
    additionalProperties: true,
  })
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({
    description: 'Public key for encryption',
    example: 'publicKey',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;
}
