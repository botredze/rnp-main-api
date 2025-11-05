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

export interface WarehouseStatisticItem {
  date: string;
  logWarehouseCoef: number;
  officeId: number;
  warehouse: string;
  warehouseCoef: number;
  giId: number;
  chrtId: number;
  size: string;
  barcode: string;
  subject: string;
  brand: string;
  vendorCode: string;
  nmId: number;
  volume: number;
  calcType: string;
  warehousePrice: number;
  barcodesCount: number;
  palletPlaceCode: number;
  palletCount: number;
  originalDate: string; // можно парсить в Date
  loyaltyDiscount: number;
  tariffFixDate: string;
  tariffLowerDate: string;
}

export type WarehouseStatistic = Array<WarehouseStatisticItem>;
