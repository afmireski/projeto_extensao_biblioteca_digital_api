import type { UserRole } from '../../infra/database/types';

export interface JwtPayload {
  sessionId: string;
  role: UserRole;
}

export interface IJwtService {
  /**
   * Signs a payload and returns a JWT string.
   * Expiry is read from the JWT_EXPIRY_DAYS env var (default: 7 days).
   */
  sign(payload: JwtPayload): Promise<string>;

  /**
   * Verifies and decodes a JWT.
   * Throws UnauthorizedError if the token is invalid or expired.
   */
  verify(token: string): Promise<JwtPayload>;
}
