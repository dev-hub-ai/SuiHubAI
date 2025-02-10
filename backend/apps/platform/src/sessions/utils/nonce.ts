import * as crypto from 'crypto';

export const generateNonce = (length = 12): string => {
  return crypto.randomBytes(length).toString('hex');
};
