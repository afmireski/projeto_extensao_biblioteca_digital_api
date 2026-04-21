import type { UserRole } from '../../infra/database/types';

export interface ActiveUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  created_at: Date;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface SignupOutput {
  email: string;
}

export interface ProfileOutput {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface UpdatePasswordInput {
  oldPassword: string;
  password: string;
  confirmPassword: string;
}
