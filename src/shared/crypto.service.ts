import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  /** Hash de senha com Argon2id (OWASP-recommended). */
  hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain).catch(() => false);
  }

  /** SHA-256 de um segredo (ex.: refresh token) — nunca guardamos plaintext. */
  sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /** Criptografia AES-256-GCM de dados sensíveis (tokens de integração PIX/TEF). */
  encrypt(plain: string, secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this._key(secret), iv);
    const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + enc.toString('hex');
  }

  decrypt(payload: string, secret: string): string {
    const [iv, tag, data] = payload.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this._key(secret),
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  }

  private _key(secret: string): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
  }
}
