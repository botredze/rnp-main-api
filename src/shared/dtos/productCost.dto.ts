import {
  OperationType,
  PriceApplicationType,
  ProductCostPriceStatus,
} from '@/infrastructure/core/typeOrm/models/productCostPrice.model';

export class CreateProductCostDto {
  productId: number;
  costPrice: number;
  fulfillment: number;
  date?: string | Date;
  operationType?: OperationType;
  forWholeProduct?: boolean;
  sizes?: string[];
}

export class UpdateProductCostDto {
  id: number;
  costPrice?: number;
  fulfillment?: number;
  date?: string | Date;
  operationType?: OperationType;
  status?: ProductCostPriceStatus;
}

export class GetProductCostDto {
  productId: number;
  date?: string | Date;
  includeHistory?: boolean;
  includeInactive?: boolean;
}

export interface CostPriceItem {
  id: number;
  productId: number;
  applicationType: PriceApplicationType;
  costPrice: number;
  fulfillment: number;
  size: string | null;
  operationType: OperationType;
  date: Date;
  status: ProductCostPriceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCostPriceResponse {
  success: boolean;
  message: string;
  data: CostPriceItem[];
}

export interface ProductWithCostPricesResponse {
  product: {
    id: number;
    nmID: number;
    sku: string;
    vendorCode: string;
    brand: string;
    title: string;
    sizes: any;
    organizationId: number;
  };
  costPrices: {
    productLevel: CostPriceItem | null;
    bySize: CostPriceItem[];
    history?: CostPriceItem[];
  };
  stats: {
    totalRecords: number;
    activeRecords: number;
    uniqueSizes: number;
    hasProductLevelPrice: boolean;
    averageCostPrice: number;
    averageFulfillment: number;
  };
}
