import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { CUSTOM_CODES } from './modules/shared';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck(): string {
    return 'OK';
  }

  @Get('statusCodes')
  getStatusCodes(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(CUSTOM_CODES);
  }
}
