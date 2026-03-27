

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

// ---- Старые типы (устаревший /adv/v1/promotion/adverts, оставлены для справки) ----

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

// ---- Новые типы для GET /api/advert/v2/adverts ----

export interface IAdvertV2BidsKopecks {
  recommendations: number;
  search: number;
}

export interface IAdvertV2NmSetting {
  bids_kopecks: IAdvertV2BidsKopecks;
  nm_id: number;
  subject: {
    id: number;
    name: string;
  };
}

export interface IAdvertV2Settings {
  name: string;
  payment_type: string;
  placements: {
    recommendations: boolean;
    search: boolean;
  };
}

export interface IAdvertV2Timestamps {
  created: string;
  deleted: string;
  started: string;
  updated: string;
}

export interface IAdvertV2InfoDetails {
  bid_type: string;
  id: number;
  nm_settings: Array<IAdvertV2NmSetting>;
  settings: IAdvertV2Settings;
  status: number;
  timestamps: IAdvertV2Timestamps;
}

export interface IAdvertV2Response {
  adverts: Array<IAdvertV2InfoDetails>;
}


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
