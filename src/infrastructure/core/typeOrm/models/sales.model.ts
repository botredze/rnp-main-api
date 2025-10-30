import {
  BeforeInsert, BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductsModel } from '@/infrastructure/core/typeOrm/models/products.model';

@Entity({name: 'sales'})
export class SalesModel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'timestamp', name: 'date' })
  date: Date;

  @Column({ name: 'nm_id' })
  nmId: string;

  @Column({ type: 'timestamp', name: 'last_change_date' })
  lastChangeDate: Date;

  @Column({ name: 'is_supply' })
  isSupply: boolean;

  @Column({ name: 'is_realization' })
  isRealization: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', name: 'discount_percent', nullable: true })
  discountPercent: number;

  @Column({ type: 'decimal', name: 'for_pay', nullable: true })
  forPay: number;

  @Column({ type: 'decimal', name: 'payment_sale_amount', nullable: true })
  paymentSaleAmount: number;

  @Column({ type: 'decimal', name: 'finished_price', nullable: true })
  finishedPrice: number;

  @Column({ type: 'decimal', name: 'price_with_disc', nullable: true })
  priceWithDisc: number;

  @Column({ name: 'is_cansel', default: false })
  isCansel: boolean;

  @Column({ type: 'timestamp', name: 'cancel_date', nullable: true })
  cancelDate: Date;

  @ManyToOne(() => ProductsModel, product => product.sales)
  @JoinColumn({name: 'product_id'})
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'sale_id' })
  saleID: string;

  @Column({ name: 'warehouse_name', nullable: true })
  warehouseName: string;

  @Column({ name: 'warehouse_type', nullable: true })
  warehouseType: string;

  @Column({ name: 'country_name', nullable: true })
  countryName: string;

  @Column({ name: 'region_name', nullable: true })
  regionName: string;

  @Column({ name: 'supplier_article', nullable: true })
  supplierArticle: string;

  @Column({ name: 'barcode', nullable: true })
  barcode: string;

  @Column({ name: 'income_id', type: 'bigint', nullable: true })
  incomeId: number;

  @Column({ name: 'spp', type: 'decimal', nullable: true })
  spp: number;

  @Column({ name: 'sticker', nullable: true })
  sticker: string;

  @Column({ name: 'g_number', nullable: true })
  gNumber: string;

  @Column({ name: 'srid', nullable: true })
  srid: string;


  @UpdateDateColumn({ name: "updated_at" })
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

  constructor(params: Partial<SalesModel> = {}) {
    Object.assign(this, params);
  }
}