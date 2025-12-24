import * as XLSX from 'xlsx';
import { FinanceReportsModel } from '@/infrastructure/core/typeOrm/models/financeReports.model';
import { WbFinanceColumns, WbFinanceRow } from '@/shared/dtos/reports.dto';

export function parseExcel<T = Record<string, any>>(buffer: Buffer, sheetIndex = 0): T[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[sheetIndex];
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json<T>(sheet, {
    defval: null,
  });
}

export const toNumber = (v: unknown): number => (v === null || v === undefined || v === '' ? 0 : Number(v));

export const toDate = (v: unknown): Date | null => (v ? new Date(String(v)) : null);

export const toBoolean = (v: unknown): boolean => String(v).toLowerCase() === 'да';

export function mapWbRowToFinanceEntity(row: WbFinanceRow, productId: number): Partial<FinanceReportsModel> {
  return {
    supplyNumber: String(row[WbFinanceColumns.SUPPLY_NUMBER] ?? ''),
    nomenclatureCode: String(row[WbFinanceColumns.NOMENCLATURE_CODE] ?? ''),
    size: String(row[WbFinanceColumns.SIZE] ?? ''),
    barcode: String(row[WbFinanceColumns.BARCODE] ?? ''),

    documentType: String(row[WbFinanceColumns.DOCUMENT_TYPE] ?? ''),

    orderDate: toDate(row[WbFinanceColumns.ORDER_DATE]),
    saleDate: toDate(row[WbFinanceColumns.SALE_DATE]),

    quantity: toNumber(row[WbFinanceColumns.QUANTITY]),
    deliveryCount: toNumber(row[WbFinanceColumns.DELIVERY_COUNT]),
    returnCount: toNumber(row[WbFinanceColumns.RETURN_COUNT]),

    retailPrice: toNumber(row[WbFinanceColumns.RETAIL_PRICE]),
    wbSaleAmount: toNumber(row[WbFinanceColumns.WB_SALE_AMOUNT]),

    productDiscountPercent: toNumber(row[WbFinanceColumns.PRODUCT_DISCOUNT_PERCENT]),
    promoCodePercent: toNumber(row[WbFinanceColumns.PROMO_CODE_PERCENT]),
    totalDiscountPercent: toNumber(row[WbFinanceColumns.TOTAL_DISCOUNT_PERCENT]),

    retailPriceWithDiscount: toNumber(row[WbFinanceColumns.RETAIL_PRICE_WITH_DISCOUNT]),

    ratingKvvReductionPercent: toNumber(row[WbFinanceColumns.RATING_KVV_REDUCTION_PERCENT]),
    actionKvvChangePercent: toNumber(row[WbFinanceColumns.ACTION_KVV_CHANGE_PERCENT]),
    sppDiscountPercent: toNumber(row[WbFinanceColumns.SPP_DISCOUNT_PERCENT]),

    kvvPercent: toNumber(row[WbFinanceColumns.KVV_PERCENT]),
    kvvWithoutVatBasePercent: toNumber(row[WbFinanceColumns.KVV_WITHOUT_VAT_BASE_PERCENT]),
    kvvWithoutVatFinalPercent: toNumber(row[WbFinanceColumns.KVV_WITHOUT_VAT_FINAL_PERCENT]),

    rewardBeforeServices: toNumber(row[WbFinanceColumns.REWARD_BEFORE_SERVICES]),
    pickupReturnCompensation: toNumber(row[WbFinanceColumns.PICKUP_RETURN_COMPENSATION]),

    acquiringFee: toNumber(row[WbFinanceColumns.ACQUIRING_FEE]),
    acquiringFeePercent: toNumber(row[WbFinanceColumns.ACQUIRING_FEE_PERCENT]),
    acquiringPaymentType: String(row[WbFinanceColumns.ACQUIRING_PAYMENT_TYPE] ?? ''),

    wbRewardWithoutVat: toNumber(row[WbFinanceColumns.WB_REWARD_WITHOUT_VAT]),
    wbRewardVat: toNumber(row[WbFinanceColumns.WB_REWARD_VAT]),
    sellerPayout: toNumber(row[WbFinanceColumns.SELLER_PAYOUT]),

    deliveryServicesCost: toNumber(row[WbFinanceColumns.DELIVERY_SERVICES_COST]),
    paidDelivery: toBoolean(row[WbFinanceColumns.PAID_DELIVERY]),

    totalFines: toNumber(row[WbFinanceColumns.TOTAL_FINES]),
    wbRewardAdjustment: toNumber(row[WbFinanceColumns.WB_REWARD_ADJUSTMENT]),

    warehouse: String(row[WbFinanceColumns.WAREHOUSE] ?? ''),
    country: String(row[WbFinanceColumns.COUNTRY] ?? ''),

    shk: String(row[WbFinanceColumns.SHK] ?? ''),
    saleType: String(row[WbFinanceColumns.SALE_TYPE] ?? ''),

    productId,
  };
}
