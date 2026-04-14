// Старый тип для CSV (DETAIL_HISTORY_REPORT — требует подписку Jam, устарел)
export interface StatisticItem {
  nmID: number;
  dt: string;
  openCardCount: number;
  addToCartCount: number;
  ordersCount: number;
  ordersSumRub: number;
  buyoutsCount: number;
  buyoutsSumRub: number;
  cancelCount: number;
  cancelSumRub: number;
  addToCartConversion: number;
  cartToOrderConversion: number;
  buyoutPercent: number;
  addToWishlist: number;
}

// Новые типы для POST /api/analytics/v3/sales-funnel/products/history
export interface SalesFunnelHistoryDay {
  date: string;
  openCount: number;
  cartCount: number;
  orderCount: number;
  orderSum: number;
  buyoutCount: number;
  buyoutSum: number;
  buyoutPercent: number;
  addToCartConversion: number;
  cartToOrderConversion: number;
  addToWishlistCount: number;
}

export interface SalesFunnelProduct {
  nmId: number;
  title: string;
  vendorCode: string;
  brandName: string;
  subjectId: number;
  subjectName: string;
}

export interface SalesFunnelHistoryItem {
  product: SalesFunnelProduct;
  history: SalesFunnelHistoryDay[];
  currency: string;
}
