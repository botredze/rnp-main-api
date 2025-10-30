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
