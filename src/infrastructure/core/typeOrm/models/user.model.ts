import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrganizationsModel } from '@/infrastructure/core/typeOrm/models/organizations.model';

export enum UserRole {
  MANAGER = 'managers',
  ADMIN = 'admins',
  USER = 'users',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  Deleted = 'deleted',
}

@Entity({ name: 'users' })
export class UserModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'login' })
  login: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'fio' })
  fio: string;

  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    name: 'status',
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrganizationsModel, (org) => org.user)
  organizations: Array<OrganizationsModel>;

  constructor(params: Partial<UserModel> = {}) {
    Object.assign(this, params);
  }
}
