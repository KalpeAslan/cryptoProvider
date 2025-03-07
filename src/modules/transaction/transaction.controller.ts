import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  ParseEnumPipe,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionService } from './transaction.service';
import { TransactionStatus } from './constants/transaction.constants';
import { CreateTransactionEncryptedDto } from './dto/create-transaction-encrypted.dto';
import { SharedConfig } from '../shared/config/shared.config';
import { EncryptionService } from '../shared/encryption/encryption.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly sharedConfig: SharedConfig,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blockchain transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.createTransaction(createTransactionDto);
  }

  @Post('encrypted')
  @ApiOperation({
    summary: 'Create a new blockchain transaction',
    description: 'Receive encrypted data ',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async createTransactionEncrypted(
    @Body() encryptedDto: CreateTransactionEncryptedDto,
  ): Promise<TransactionResponseDto> {
    const decryptedData = this.encryptionService.decryptData(
      encryptedDto.data,
      this.sharedConfig.encryption.privateKey,
    ) as string;
    console.log(JSON.parse(decryptedData));
    return this.transactionService.createTransaction(JSON.parse(decryptedData));
  }

  @Post('test')
  @ApiOperation({
    summary:
      'ONLY: FOR DEVELOPERS!!! Create a new blockchain transaction without queue',
    deprecated: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  async createTransactionTest(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.createTransactionTest(createTransactionDto);
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Get transactions by status' })
  @ApiQuery({
    name: 'status',
    enum: TransactionStatus,
    description: 'Transaction status to filter by',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: [TransactionResponseDto],
  })
  async getTransactionsByStatus(
    @Query('status') status: TransactionStatus,
  ): Promise<TransactionResponseDto[]> {
    return this.transactionService.getTransactionsByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction information by ID' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID (UUID)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction information retrieved successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async getTransactionInfo(
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionService.getTransactionInfo(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction by ID' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID (UUID)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async deleteTransactionById(@Param('id') id: string): Promise<void> {
    return this.transactionService.deleteTransactionById(id);
  }

  @Delete('by-status/:status')
  @ApiOperation({ summary: 'Delete transactions by status' })
  @ApiParam({
    name: 'status',
    enum: TransactionStatus,
    description: 'Transaction status',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions deleted successfully',
  })
  async deleteTransactionsByStatus(
    @Param('status', new ParseEnumPipe(TransactionStatus))
    status: TransactionStatus,
  ): Promise<void> {
    return this.transactionService.deleteTransactionsByStatus(status);
  }
}
