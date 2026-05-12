import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const AUTH_TAG_LEN = 16;

@Injectable()
export class ProofEncryptionService implements OnModuleInit {
  private readonly logger = new Logger(ProofEncryptionService.name);
  private key: Buffer | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const raw =
      this.config.get<string>('PROOF_ENCRYPTION_KEY')?.trim() ||
      process.env.PROOF_ENCRYPTION_KEY?.trim() ||
      '';
    if (!raw) {
      this.logger.warn(
        'PROOF_ENCRYPTION_KEY is not set — encrypted proof uploads will be disabled until configured (32-byte key, hex 64 chars or base64).',
      );
      return;
    }
    const trimmed = raw.trim();
    try {
      if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        this.key = Buffer.from(trimmed, 'hex');
      } else {
        this.key = Buffer.from(trimmed, 'base64');
      }
      if (this.key.length !== 32) {
        this.logger.error(
          `PROOF_ENCRYPTION_KEY must decode to 32 bytes (got ${this.key.length}).`,
        );
        this.key = null;
      }
    } catch {
      this.logger.error('PROOF_ENCRYPTION_KEY is invalid.');
      this.key = null;
    }
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  /** Encrypt buffer, write under uploads/funding-proofs/{uuid}.enc — returns paths + sha256 of ciphertext file */
  async encryptAndPersist(params: {
    plain: Buffer;
    originalFilename: string;
  }): Promise<{
    relativePath: string;
    sha256Hex: string;
    absolutePath: string;
  }> {
    if (!this.key) {
      throw new Error(
        'Proof encryption is not configured (set PROOF_ENCRYPTION_KEY).',
      );
    }

    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(params.plain),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    const payload = Buffer.concat([iv, authTag, ciphertext]);

    const id = randomBytes(16).toString('hex');
    const dir = path.join(process.cwd(), 'uploads', 'funding-proofs');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${id}.enc`;
    const absolutePath = path.join(dir, filename);
    fs.writeFileSync(absolutePath, payload);

    const sha256Hex = createHash('sha256').update(payload).digest('hex');
    const relativePath = path.join('uploads', 'funding-proofs', filename);

    return {
      relativePath: relativePath.replace(/\\/g, '/'),
      sha256Hex,
      absolutePath,
    };
  }

  decryptFromRelativePath(relativePath: string): Buffer {
    if (!this.key) {
      throw new Error('Proof encryption is not configured.');
    }
    const abs = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(process.cwd(), relativePath);
    if (!fs.existsSync(abs)) {
      throw new Error('Encrypted proof file not found.');
    }
    const payload = fs.readFileSync(abs);
    if (payload.length < IV_LEN + AUTH_TAG_LEN + 1) {
      throw new Error('Invalid encrypted file.');
    }
    const iv = payload.subarray(0, IV_LEN);
    const authTag = payload.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
    const ciphertext = payload.subarray(IV_LEN + AUTH_TAG_LEN);
    const decipher = createDecipheriv(ALGO, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}
