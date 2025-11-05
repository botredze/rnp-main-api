export class GetProductListQuery {
  organizationId?: number;
  productId?: number;

  constructor(params: Partial<GetProductListQuery> = {}) {
    Object.assign(this, params);
  }
}

export class GetRnpAnalyticsDto {
  productId: number;
  startDate?: string;
  endDate?: string;
  periodTypes: 'day' | 'week' | 'month' | 'custom';

  constructor(params: Partial<GetRnpAnalyticsDto> = {}) {
    Object.assign(this, params);
  }
}
