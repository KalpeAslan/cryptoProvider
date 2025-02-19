import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  /**
   * Returns the maximum chunk size (in bytes) for a given RSA key and OAEP parameters.
   * Here we assume a 1024-bit key with SHA-256:
   * maxChunkSize = 128 - (2 * 32) - 2 = 62 bytes.
   *
   * For other key sizes, adjust accordingly.
   */
  private getMaxChunkSize(): number {
    return 62;
  }

  /**
   * Encrypts data using the provided public key.
   * If the data exceeds the maximum size for one RSA encryption operation,
   * it will be split into chunks and each chunk encrypted separately.
   *
   * @param data - The plain text to encrypt.
   * @param publicKey - The RSA public key.
   * @returns A string containing base64-encoded encrypted chunks, joined by a delimiter.
   */
  encryptData(data: string, publicKey: string): string {
    const maxChunkSize = this.getMaxChunkSize();
    const buffer = Buffer.from(data, 'utf8');
    const encryptedChunks: string[] = [];

    for (let offset = 0; offset < buffer.length; offset += maxChunkSize) {
      const chunk = buffer.slice(offset, offset + maxChunkSize);
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        chunk,
      );
      encryptedChunks.push(encrypted.toString('base64'));
    }

    // Join encrypted chunks with a delimiter (colon in this example)
    return encryptedChunks.join(':');
  }

  /**
   * Decrypts data that was encrypted with encryptData().
   * It splits the encrypted string by the delimiter, decrypts each chunk,
   * and then concatenates them back together.
   *
   * @param encryptedData - The encrypted string with base64 chunks separated by a colon.
   * @param privateKey - The RSA private key.
   * @returns The decrypted plain text.
   */
  decryptData(encryptedData: string, privateKey: string): unknown {
    const encryptedChunks = encryptedData.split(':');
    const decryptedBuffers: Buffer[] = [];

    for (const chunk of encryptedChunks) {
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        Buffer.from(chunk, 'base64'),
      );
      decryptedBuffers.push(decrypted);
    }

    return Buffer.concat(decryptedBuffers).toString('utf8');
  }
}
