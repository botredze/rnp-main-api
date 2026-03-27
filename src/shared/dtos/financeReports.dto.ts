// shared/dtos/financeReports.dto.ts

// Еженедельный отчет
export interface WeeklyReportRow {
  reportNumber: string;
  legalEntity: string;
  startDate: Date;
  endDate: Date;
  formationDate: Date;
  reportType: string;
  sales: number;
  loyaltyCompensation: number;
  toTransfer: number;
  agreedDiscount: number;
  logisticsCost: number;
  storageCost: number;
  acceptanceCost: number;
  otherCharges: number;
  totalFines: number;
  vvCorrection: number;
  loyaltyProgramCost: number;
  loyaltyPointsDeduction: number;
  paymentTermChange: number;
  totalToPay: number;
  currency: string;
}

export interface UploadWeeklyReportDto {
  organizationId: number;
}

export interface UploadDetailedReportDto {
  organizationId: number;
}

// Запрос дашборда
export interface GetDashboardDto {
  organizationId: number;
  startDate?: string;
  endDate?: string;
  taxRate?: number; // Ставка налога (0–1), напр. 0.02 = 2% УСН
}

// Запрос сводного отчета
export interface GetSummaryReportDto {
  organizationId: number;
  startDate?: string;
  endDate?: string;
  taxRate?: number; // Ставка налога (0–1), напр. 0.02 = 2% УСН
}

// Ответ дашборда
export interface DashboardMetric {
  title: string;
  value: string;
  subtitle: string;
  badge?: string;
  change: string | null;
  isNegative: boolean;
}

export interface DashboardResponse {
  metrics: DashboardMetric[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Ответ сводного отчета
export interface WeekPeriod {
  label: string;
  startDate: string;
  endDate: string;
}

export interface SalesData {
  sales: number;
  returns: number;
  deliveries: number;
}

export interface AvgData {
  price: number;
  commission: number;
  transfer: number;
  delivery: number;
  cost: number;
  margin: number;
}

export interface FinanceData {
  revenue: number;
  commission: number;
  commissionPct: string;
  acquiring: number;
  transfer: number;
  deliveryCost: number;
  deliveryCostForward: number;
  deliveryCostReturn: number;
  fines: number;
  acceptance: number;
  deductions: number;
  storage: number;
  totalPay: number;
  cost: number;
  tax: number;
  externalExpenses: number;
  profit: number;
}

export interface CorrectionsData {
  acquiring: string;
  replacedGoods: string;
  lostGoods: string;
  defect: string | number;
  salesCorrection: string;
  logisticsCorrection: string;
  advancePayment: string;
}

export interface SummaryReportResponse {
  months: WeekPeriod[];
  salesData: SalesData[];
  avgData: AvgData[];
  financeData: FinanceData[];
  corrections: CorrectionsData[];
}

// Доступные даты отчетов
export interface AvailableDatesResponse {
  minDate: string;
  maxDate: string;
  availableMonths: string[];
}

export interface GetDetailedReportDto {
  organizationId: number;
  startDate?: string;
  endDate?: string;
  size?: string;
  documentType?: string; // 'Продажа' | 'Возврат'
  warehouse?: string;
  searchQuery?: string; // для поиска по баркоду
  page?: number;
  limit?: number;
}

export interface DetailedReportItem {
  id: number;
  documentType: string;
  size: string;
  barcode: string;
  orderDate: string;
  saleDate: string;
  quantity: number;
  saleAmount: number;
  commission: number;
  priceWithDiscount: number;
  sppDiscount: number;
  kvvPercent: number;
  sellerPayout: number;
  warehouse: string;
  vendorCode?: string;
  productTitle?: string;
}

export interface DetailedReportResponse {
  data: DetailedReportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalSales: number;
    totalReturns: number;
    totalRevenue: number;
    totalCommission: number;
    totalPayout: number;
  };
}
