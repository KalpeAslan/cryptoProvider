import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { EncryptionService } from '../encryption/encryption.service';
import { SharedConfig } from '../config/shared.config';

@Injectable()
export class DecryptionInterceptor implements NestInterceptor {
  private readonly privateKey: string;

  /**
   * @param encryptionService The encryption service.
   * @param privateKey The private key used for decryption.
   */
  constructor(
    private readonly sharedConfig: SharedConfig,
    private readonly encryptionService: EncryptionService,
  ) {
    this.privateKey = this.sharedConfig.encryption.privateKey;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Only handle POST requests with an encrypted payload
    if (request.method === 'POST' && request.body && request.body.data) {
      try {
        const decryptedData = this.encryptionService.decryptData(
          request.body.data,
          this.privateKey,
        );
        // Replace the encrypted data with the decrypted version
        request.body.data = decryptedData;
      } catch (error) {
        throw new BadRequestException('Invalid encrypted payload');
      }
    }

    return next.handle();
  }
}
