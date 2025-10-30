

export interface IAdvertDto {
  adverts: Array<IAdvertInfo>
}

export interface IAdvertInfo {
  type: number;
  status: number;
  count: number;
  advert_list: Array<IAdvertDetails>
}

export interface IAdvertDetails {
  advertId: number;
  changeTime: string;
}

export interface IAdvertInfoDetails {
  endTime: string;
  createTime: string;
  changeTime: string;
  startTime: string;
  autoParams: IAdvertAutoParams;
  name: string;
  dailyBudget: number;
  advertId: number;
  status: number;
  type: number;
  paymentType: string;
}

export interface IAdvertAutoParams {
  subject: {
    name: string;
    id: number;
  };
  sets: Array<{
    name: string;
    id: number;
  }>;
  nms: Array<number>;
  active: {
    carousel: boolean;
    recom: boolean;
    booster: boolean;
  };
  nmCPM: Array<{
    nm: number;
    cpm: number;
  }>;
}

export type IAdvertInfoDetailsArray = Array<IAdvertInfoDetails>;


interface Nm {
  atbs: number;
  canceled: number;
  clicks: number;
  cpc: number;
  cr: number;
  ctr: number;
  name: string;
  nmId: number;
  orders: number;
  shks: number;
  sum: number;
  sum_price: number;
  views: number;
}

interface App {
  appType: number;
  atbs: number;
  canceled: number;
  clicks: number;
  cpc: number;
  cr: number;
  ctr: number;
  nms: Array<Nm>;
  orders: number;
  shks: number;
  sum: number;
  sum_price: number;
  views: number;
}

interface Day {
  apps: Array<App>;
  atbs: number;
  canceled: number;
  clicks: number;
  cpc: number;
  cr: number;
  ctr: number;
  date: string; // ISO string
  orders: number;
  shks: number;
  sum: number;
  sum_price: number;
  views: number;
}

interface BoosterStat {
  avg_position: number;
  date: string; // ISO string
  nm: number;
}

export interface AdvertStats {
  advertId: number;
  atbs: number;
  canceled: number;
  clicks: number;
  cpc: number;
  cr: number;
  ctr: number;
  boosterStats?: Array<BoosterStat>;
  days: Array<Day>;
  orders: number;
  shks: number;
  sum: number;
  sum_price: number;
  views: number;
}

export interface AdvertPayHistory {
  updNum: number;                 // номер обновления
  updTime: string;                // время обновления в ISO формате
  updSum: number;                 // сумма обновления
  advertId: number;               // ID объявления
  campName: string;               // название кампании
  advertType: number;             // тип объявления (числовой код)
  paymentType: string;            // способ оплаты
  advertStatus: number;           // статус объявления (числовой код)
}
