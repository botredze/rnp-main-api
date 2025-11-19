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

@Entity({ name: 'orders' })
export class OrderModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'timestamp', name: 'last_change_date' })
  lastChangeDate: Date;

  @Column({ name: 'warehouse_name', nullable: true })
  warehouseName: string;

  @Column({ name: 'warehouse_type', nullable: true })
  warehouseType: string;

  @Column({ name: 'country_name', nullable: true })
  countryName: string;

  @Column({ name: 'oblast_okrug_name', nullable: true })
  oblastOkrugName: string;

  @Column({ name: 'region_name', nullable: true })
  regionName: string;

  @Column({ name: 'supplier_article', nullable: true })
  supplierArticle: string;

  @Column({ name: 'nm_id' })
  nmId: number;

  @Column({ name: 'barcode', nullable: true })
  barcode: string;

  @Column({ name: 'category', nullable: true })
  category: string;

  @Column({ name: 'subject', nullable: true })
  subject: string;

  @Column({ name: 'brand', nullable: true })
  brand: string;

  @Column({ name: 'tech_size', nullable: true })
  techSize: string;

  @Column({ name: 'income_id' })
  incomeID: number;

  @Column({ name: 'is_supply' })
  isSupply: boolean;

  @Column({ name: 'is_realization' })
  isRealization: boolean;

  @Column({ type: 'decimal', name: 'total_price', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ type: 'decimal', name: 'discount_percent', nullable: true })
  discountPercent: number;

  @Column({ name: 'spp', nullable: true })
  spp: number;

  @Column({ type: 'decimal', name: 'finished_price', nullable: true })
  finishedPrice: number;

  @Column({ type: 'decimal', name: 'price_with_disc', nullable: true })
  priceWithDisc: number;

  @Column({ name: 'is_cancel', default: false })
  isCancel: boolean;

  @Column({ type: 'timestamp', name: 'cancel_date', nullable: true })
  cancelDate: Date;

  @Column({ name: 'sticker', nullable: true })
  sticker: string;

  @Column({ name: 'g_number', nullable: true })
  gNumber: string;

  @Column({ name: 'srid', nullable: true })
  srid: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductsModel, (product) => product.orders)
  @JoinColumn({ name: 'product_id' })
  product: ProductsModel;

  @Column({ name: 'product_id' })
  productId: number;

  @BeforeInsert()
  setTimestampsOnInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  constructor(params: Partial<OrderModel> = {}) {
    Object.assign(this, params);
  }
}
