import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

@Entity({ name: 'finance_reports' })
export class FinanceReportsModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /* ===== Основные идентификаторы ===== */

  @Column({ name: 'supply_number', type: 'varchar', nullable: true })
  supplyNumber: string;

  @Column({ name: 'nomenclature_code', type: 'varchar', nullable: true })
  nomenclatureCode: string;

  @Column({ name: 'size', type: 'varchar', nullable: true })
  size: string;

  @Column({ name: 'barcode', type: 'varchar', nullable: true })
  barcode: string;

  /* ===== Документ ===== */

  @Column({ name: 'document_type', type: 'varchar', nullable: true })
  documentType: string;

  /* ===== Даты ===== */

  @Column({ name: 'order_date', type: 'date', nullable: true })
  orderDate: Date;

  @Column({ name: 'sale_date', type: 'date', nullable: true })
  saleDate: Date;

  /* ===== Количества ===== */

  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity: number;

  @Column({ name: 'delivery_count', type: 'int', nullable: true })
  deliveryCount: number;

  @Column({ name: 'return_count', type: 'int', nullable: true })
  returnCount: number;

  /* ===== Цены и скидки ===== */

  @Column({ name: 'retail_price', type: 'numeric', nullable: true })
  retailPrice: number;

  @Column({ name: 'wb_sale_amount', type: 'numeric', nullable: true })
  wbSaleAmount: number;

  @Column({ name: 'product_discount_percent', type: 'numeric', nullable: true })
  productDiscountPercent: number;

  @Column({ name: 'promo_code_percent', type: 'numeric', nullable: true })
  promoCodePercent: number;

  @Column({ name: 'total_discount_percent', type: 'numeric', nullable: true })
  totalDiscountPercent: number;

  @Column({ name: 'retail_price_with_discount', type: 'numeric', nullable: true })
  retailPriceWithDiscount: number;

  @Column({ name: 'rating_kvv_reduction_percent', type: 'numeric', nullable: true })
  ratingKvvReductionPercent: number;

  @Column({ name: 'action_kvv_change_percent', type: 'numeric', nullable: true })
  actionKvvChangePercent: number;

  @Column({ name: 'spp_discount_percent', type: 'numeric', nullable: true })
  sppDiscountPercent: number;

  /* ===== Комиссии ===== */

  @Column({ name: 'kvv_percent', type: 'numeric', nullable: true })
  kvvPercent: number;

  @Column({ name: 'kvv_without_vat_base_percent', type: 'numeric', nullable: true })
  kvvWithoutVatBasePercent: number;

  @Column({ name: 'kvv_without_vat_final_percent', type: 'numeric', nullable: true })
  kvvWithoutVatFinalPercent: number;

  @Column({ name: 'reward_before_services', type: 'numeric', nullable: true })
  rewardBeforeServices: number;

  @Column({ name: 'pickup_return_compensation', type: 'numeric', nullable: true })
  pickupReturnCompensation: number;

  @Column({ name: 'acquiring_fee', type: 'numeric', nullable: true })
  acquiringFee: number;

  @Column({ name: 'acquiring_fee_percent', type: 'numeric', nullable: true })
  acquiringFeePercent: number;

  @Column({ name: 'acquiring_payment_type', type: 'varchar', nullable: true })
  acquiringPaymentType: string;

  @Column({ name: 'wb_reward_without_vat', type: 'numeric', nullable: true })
  wbRewardWithoutVat: number;

  @Column({ name: 'wb_reward_vat', type: 'numeric', nullable: true })
  wbRewardVat: number;

  @Column({ name: 'seller_payout', type: 'numeric', nullable: true })
  sellerPayout: number;

  /* ===== Логистика ===== */

  @Column({ name: 'delivery_services_cost', type: 'numeric', nullable: true })
  deliveryServicesCost: number;

  @Column({ name: 'paid_delivery', type: 'boolean', nullable: true })
  paidDelivery: boolean;

  @Column({ name: 'total_fines', type: 'numeric', nullable: true })
  totalFines: number;

  @Column({ name: 'wb_reward_adjustment', type: 'numeric', nullable: true })
  wbRewardAdjustment: number;

  @Column({ name: 'logistics_types', type: 'varchar', nullable: true })
  logisticsTypes: string;

  /* ===== Партнеры и склады ===== */

  @Column({ name: 'warehouse', type: 'varchar', nullable: true })
  warehouse: string;

  @Column({ name: 'country', type: 'varchar', nullable: true })
  country: string;

  /* ===== Прочее ===== */

  @Column({ name: 'shk', type: 'varchar', nullable: true })
  shk: string;

  @Column({ name: 'srid', type: 'varchar', nullable: true })
  srid: string;

  @Column({ name: 'sale_type', type: 'varchar', nullable: true })
  saleType: string;

  /** связь с продуктом */
  @ManyToOne(() => ProductsModel, (product) => product.stockOnSide, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<FinanceReportsModel> = {}) {
    Object.assign(this, params);
  }
}
