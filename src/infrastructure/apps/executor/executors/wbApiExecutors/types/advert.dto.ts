

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
