import type { UserRole } from '../../infra/database/types';

export interface ActiveUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  email: string;
  name: string;
}
