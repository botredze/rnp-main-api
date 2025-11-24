import { UserRole, UserStatus } from '@/infrastructure/core/typeOrm/models/user.model';

export interface UserDto {
  login: string;
  password: string;
  fio: string;
  role: UserRole;
}

export interface GetUserDto {
  role?: UserRole;
  status?: UserStatus;
  orderBy?: OrderBy;
}

export interface OrderBy {
  field?: string;
  order?: 'ASC' | 'DESC';
}
