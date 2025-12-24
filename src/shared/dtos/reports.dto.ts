export interface ReportsDto {
  productId?: number;
  organizationId?: number;
}

export enum WbFinanceColumns {
  SUPPLY_NUMBER = 'Номер поставки',
  NOMENCLATURE_CODE = 'Код номенклатуры',
  SIZE = 'Размер',
  BARCODE = 'Баркод',

  DOCUMENT_TYPE = 'Тип документа',

  ORDER_DATE = 'Дата заказа покупателем',
  SALE_DATE = 'Дата продажи',
  FIXATION_START_DATE = 'Дата начала действия фиксации',

  QUANTITY = 'Кол-во',
  DELIVERY_COUNT = 'Количество доставок',
  RETURN_COUNT = 'Количество возврата',

  RETAIL_PRICE = 'Цена розничная',
  WB_SALE_AMOUNT = 'Вайлдберриз реализовал Товар (Пр)',

  PRODUCT_DISCOUNT_PERCENT = 'Согласованный продуктовый дисконт, %',
  PROMO_CODE_PERCENT = 'Промокод, %',
  TOTAL_DISCOUNT_PERCENT = 'Итоговая согласованная скидка, %',

  RETAIL_PRICE_WITH_DISCOUNT = 'Цена розничная с учетом согласованной скидки',

  RATING_KVV_REDUCTION_PERCENT = 'Размер снижения кВВ из-за рейтинга, %',
  ACTION_KVV_CHANGE_PERCENT = 'Размер изменения кВВ из-за акции, %',
  SPP_DISCOUNT_PERCENT = 'Скидка постоянного Покупателя (СПП), %',

  KVV_PERCENT = 'Размер кВВ, %',
  KVV_WITHOUT_VAT_BASE_PERCENT = 'Размер кВВ без НДС, % Базовый',
  KVV_WITHOUT_VAT_FINAL_PERCENT = 'Итоговый кВВ без НДС, %',

  REWARD_BEFORE_SERVICES = 'Вознаграждение с продаж до вычета услуг поверенного, без НДС',
  PICKUP_RETURN_COMPENSATION = 'Возмещение за выдачу и возврат товаров на ПВЗ',

  ACQUIRING_FEE = 'Эквайринг/Комиссии за организацию платежей',
  ACQUIRING_FEE_PERCENT = 'Размер комиссии за эквайринг/Комиссии за организацию платежей, %',
  ACQUIRING_PAYMENT_TYPE = 'Тип платежа за Эквайринг/Комиссии за организацию платежей',

  WB_REWARD_WITHOUT_VAT = 'Вознаграждение Вайлдберриз (ВВ), без НДС',
  WB_REWARD_VAT = 'НДС с Вознаграждения Вайлдберриз',
  SELLER_PAYOUT = 'К перечислению Продавцу за реализованный Товар',

  DELIVERY_SERVICES_COST = 'Услуги по доставке товара покупателю',
  PAID_DELIVERY = 'Признак услуги платной доставки',

  TOTAL_FINES = 'Общая сумма штрафов',
  WB_REWARD_ADJUSTMENT = 'Корректировка Вознаграждения Вайлдберриз (ВВ)',

  WAREHOUSE = 'Склад',
  COUNTRY = 'Страна',

  ASSEMBLY_TASK_NUMBER = 'Номер сборочного задания',
  SHK = 'ШК',
  SALE_TYPE = 'Способы продажи и тип товара',
}

export type WbFinanceRow = {
  [WbFinanceColumns.SUPPLY_NUMBER]: string;
  [WbFinanceColumns.NOMENCLATURE_CODE]: string;
  [WbFinanceColumns.SIZE]: string;
  [WbFinanceColumns.BARCODE]: string;

  [WbFinanceColumns.DOCUMENT_TYPE]: string;

  [WbFinanceColumns.ORDER_DATE]: string;
  [WbFinanceColumns.SALE_DATE]: string;
  [WbFinanceColumns.FIXATION_START_DATE]: string;

  [WbFinanceColumns.QUANTITY]: number;
  [WbFinanceColumns.DELIVERY_COUNT]: number;
  [WbFinanceColumns.RETURN_COUNT]: number;

  [WbFinanceColumns.RETAIL_PRICE]: number;
  [WbFinanceColumns.WB_SALE_AMOUNT]: number;

  [WbFinanceColumns.PRODUCT_DISCOUNT_PERCENT]: number;
  [WbFinanceColumns.PROMO_CODE_PERCENT]: number;
  [WbFinanceColumns.TOTAL_DISCOUNT_PERCENT]: number;

  [WbFinanceColumns.RETAIL_PRICE_WITH_DISCOUNT]: number;

  [WbFinanceColumns.RATING_KVV_REDUCTION_PERCENT]: number;
  [WbFinanceColumns.ACTION_KVV_CHANGE_PERCENT]: number;
  [WbFinanceColumns.SPP_DISCOUNT_PERCENT]: number;

  [WbFinanceColumns.KVV_PERCENT]: number;
  [WbFinanceColumns.KVV_WITHOUT_VAT_BASE_PERCENT]: number;
  [WbFinanceColumns.KVV_WITHOUT_VAT_FINAL_PERCENT]: number;

  [WbFinanceColumns.REWARD_BEFORE_SERVICES]: number;
  [WbFinanceColumns.PICKUP_RETURN_COMPENSATION]: number;

  [WbFinanceColumns.ACQUIRING_FEE]: number;
  [WbFinanceColumns.ACQUIRING_FEE_PERCENT]: number;
  [WbFinanceColumns.ACQUIRING_PAYMENT_TYPE]: string;

  [WbFinanceColumns.WB_REWARD_WITHOUT_VAT]: number;
  [WbFinanceColumns.WB_REWARD_VAT]: number;
  [WbFinanceColumns.SELLER_PAYOUT]: number;

  [WbFinanceColumns.DELIVERY_SERVICES_COST]: number;
  [WbFinanceColumns.PAID_DELIVERY]: string;

  [WbFinanceColumns.TOTAL_FINES]: number;
  [WbFinanceColumns.WB_REWARD_ADJUSTMENT]: number;

  [WbFinanceColumns.WAREHOUSE]: string;
  [WbFinanceColumns.COUNTRY]: string;

  [WbFinanceColumns.ASSEMBLY_TASK_NUMBER]: string;
  [WbFinanceColumns.SHK]: string;
  [WbFinanceColumns.SALE_TYPE]: string;
};
