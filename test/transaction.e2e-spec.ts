import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateTransactionDto } from '../src/modules/transaction/dto/create-transaction.dto';
import { NetworkType } from '../src/modules/shared/types/network.types';
import { TransactionStatus } from '../src/modules/transaction/constants/transaction.constants';
import { v4 as uuidv4 } from 'uuid';
import { ValidationPipe } from '@nestjs/common';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let testTransactionId: string;

  const mockCreateTransactionDto: CreateTransactionDto = {
    from: '0x71bE63f3384f5fb98995898A86B02Fb2426c5788',
    to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey:
      '0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82',
    amount: '10',
    tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    gas: 0,
    network: NetworkType.POLYGON,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /transactions', () => {
    it('should create a new transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .send(mockCreateTransactionDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(TransactionStatus.PENDING_QUEUE);
      expect(response.body.from).toBe(mockCreateTransactionDto.from);
      expect(response.body.to).toBe(mockCreateTransactionDto.to);
      expect(response.body.amount).toBe(mockCreateTransactionDto.amount);
      expect(response.body.network).toBe(mockCreateTransactionDto.network);

      testTransactionId = response.body.id;
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        from: '0x1234', // Invalid address
        amount: 'not a number',
      };

      await request(app.getHttpServer())
        .post('/transactions')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /transactions/:id', () => {
    it('should get transaction by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${testTransactionId}`)
        .expect(200);

      expect(response.body.id).toBe(testTransactionId);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .get(`/transactions/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('GET /transactions/by-status', () => {
    it('should get transactions by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/by-status')
        .query({ status: TransactionStatus.PENDING_QUEUE })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('status');
        expect(response.body[0].status).toBe(TransactionStatus.PENDING_QUEUE);
      }
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete transaction by ID', async () => {
      // First create a transaction to delete
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .send(mockCreateTransactionDto)
        .expect(201);

      const transactionId = createResponse.body.id;

      // Then delete it
      await request(app.getHttpServer())
        .delete(`/transactions/${transactionId}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent transaction', async () => {
      const nonExistentId = uuidv4();
      await request(app.getHttpServer())
        .delete(`/transactions/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('DELETE /transactions/by-status/:status', () => {
    it('should delete transactions by status', async () => {
      // First create a transaction
      await request(app.getHttpServer())
        .post('/transactions')
        .send(mockCreateTransactionDto)
        .expect(201);

      // Then delete all pending transactions
      await request(app.getHttpServer())
        .delete(`/transactions/by-status/${TransactionStatus.PENDING_QUEUE}`)
        .expect(200);

      // Verify no pending transactions exist
      const response = await request(app.getHttpServer())
        .get('/transactions/by-status')
        .query({ status: TransactionStatus.PENDING_QUEUE })
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });
});
