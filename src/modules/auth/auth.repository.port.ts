import type { ActiveUser } from './auth.types';

/**
 * Repository interface for authentication-related database access.
 * Defines operations for retrieving active users and managing user sessions.
 */
export interface IAuthRepository {
  /**
   * Finds an active (non-deleted) user by email.
   * Returns null if not found or soft-deleted.
   */
  findActiveUserByEmail(email: string): Promise<ActiveUser | null>;

  /**
   * Persists a new session for a given user with a defined expiry timestamp.
   * Returns the generated session id.
   */
  createSession(userId: string, expiresAt: Date): Promise<string>;
}
