import * as crypto from 'crypto';

/**
 * Generate a MongoDB-compatible ObjectID (24 hex characters)
 */
export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}
