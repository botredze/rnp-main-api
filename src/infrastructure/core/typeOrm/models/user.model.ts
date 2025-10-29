import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'users'})
export class UserModel {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'login' })
  login: string;

  @Column({ name: 'password' })
  password: string;

  @Column({ name: 'fio' })
  fio: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(params: Partial<UserModel> = {}) {
    Object.assign(this, params);
  }

}