
export interface StocksDto {
  name: string;
  officeId: number;
  id: number;
  cargoType: number;
  deliveryType: number;
  isDeleting: boolean;
  isProcessing: boolean;
}

export type StocksDtoArray = Array<StocksDto>;