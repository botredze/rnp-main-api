import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export const hash = async (
  str: string,
  params?: {
    isLaravelCompatible?: boolean;
  },
): Promise<string> => {
  const isLaravelCompatible = params?.isLaravelCompatible ?? false;

  let hash = await bcrypt.hash(str, 10);

  if (isLaravelCompatible) {
    hash = hash.replace(/^\$2a(.+)$/i, '$2y$1');
  }

  return hash;
};

export const validateHash = async (str: string, hash: string): Promise<boolean> => {
  // Laravel backward compatible
  const hashNormalized = hash.replace(/^\$2y(.+)$/i, '$2a$1');

  const isValid = bcrypt.compare(str, hashNormalized);

  return isValid;
};

export const hashMD5 = (str: string): string => crypto.createHash('md5').update(str).digest('hex');
