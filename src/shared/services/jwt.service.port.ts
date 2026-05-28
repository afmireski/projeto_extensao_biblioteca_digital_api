import type { UserRole } from '../../infra/database/types';

/**
 * Payload structure for JSON Web Tokens used in authentication.
 */
export interface JwtPayload {
  sessionId: string;
  role: UserRole;
}

/**
 * Service port interface for handling JWT signing and verification.
 */
export interface IJwtService {
  /**
   * Signs a payload and returns a JSON Web Token string.
   * Expiry is read from the JWT_EXPIRY_DAYS env var (default: 7 days).
   * @param payload - The payload containing session ID and user role to encode.
   * @returns A promise that resolves to the signed JWT string.
   */
  sign(payload: JwtPayload): Promise<string>;

  /**
   * Verifies, validates, and decodes a JSON Web Token string.
   * @param token - The JWT string to verify.
   * @returns A promise that resolves to the decoded token payload.
   * @throws {UnauthorizedError} If the token is invalid, signature mismatch, or expired.
   */
  verify(token: string): Promise<JwtPayload>;
}
