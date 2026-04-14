import * as crypto from 'crypto';

export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function calculateFileMD5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export function createRecordKey(params: {
  productId: number;
  saleDate: Date;
  srid: string;
  documentType: string;
}): string {
  const { productId, saleDate, srid, documentType } = params;
  const dateStr =
    saleDate instanceof Date ? saleDate.toISOString().split('T')[0] : new Date(saleDate).toISOString().split('T')[0];
  return `${productId}_${dateStr}_${srid}_${documentType}`;
}
