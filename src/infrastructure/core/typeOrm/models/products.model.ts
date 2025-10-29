import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column
} from 'typeorm';

export class ProductsModel {

  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'nmID' })
  nmID: string;

  @Column({ name: 'sku' })
  sku: string;

  @Column({ name: 'vendor_code' })
  vendorCode: string;

  @Column({ name: 'brand' })
  brand: string;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'video', nullable: true })
  video: string;

  @Column({ type: 'json', name: 'characteristics', nullable: true })
  characteristics: any;

  @Column({ type: 'json', name: 'sizes', nullable: true })
  sizes: any;

  @Column({ type: 'json', name: 'photos', nullable: true })
  photos: any;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<ProductsModel> = {}) {
    Object.assign(this, params);
  }

}
