import { DecryptoDto } from '@/modules/shared/dto/decrypto.dto';
import { EncryptTestDto } from '@/modules/shared/dto/encrypt-test.dto';
import { Controller, Post, Body, Res, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EncryptionService } from '@/modules/shared/encryption/encryption.service';
import { CUSTOM_CODES } from '@/modules/shared/constants/custom-codes.constants';
import { Response } from 'express';

@ApiTags('Tools')
@Controller('tools')
export class ToolsController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('encrypt')
  @ApiOperation({ summary: 'Encrypt data' })
  encrypt(@Body() body: EncryptTestDto) {
    return this.encryptionService.encryptData(
      JSON.stringify(body.data),
      body.publicKey,
    );
  }

  @Post('decrypt')
  @ApiOperation({ summary: 'Decrypt data' })
  decrypt(@Body() body: DecryptoDto) {
    return this.encryptionService.decryptData(body.data, body.privateKey);
  }

  @Get('statusCodes')
  getStatusCodes(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(CUSTOM_CODES);
  }
}
