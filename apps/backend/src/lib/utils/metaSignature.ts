import crypto from 'crypto';
import { env } from '@notifyiq/config';

export function verifyMetaSignature(rawBody: Buffer, signatureHeader: string): boolean {
  if (!signatureHeader) {
    return false;
  }

  // Signature header format: sha256=HEX_SIGNATURE
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedSignature = parts[1];
  const appSecret = env.META_APP_SECRET || '';

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const actualSignature = hmac.digest('hex');

  // Time-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(actualSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  );
}
