export interface StocksDto {
  id: number; // внешний id склада
  name: string; // название ("Коледино")
  address: string; // строковый адрес
  city: string; // "Москва"
  longitude: number; // координата
  latitude: number; // координата
  cargoType: number; // тип груза
  deliveryType: number; // тип доставки
  federalDistrict: string; // "Центральный"
  selected: boolean; // выбран ли склад

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

export interface WarehouseInfo {
  warehouseName: string;
  quantity: number;
}

export interface ProductStockInfo {
  brand: string;
  subjectName: string;
  vendorCode: string;
  nmId: number;
  barcode: string;
  techSize: string;
  volume: number;
  warehouses: Array<WarehouseInfo>;
}
