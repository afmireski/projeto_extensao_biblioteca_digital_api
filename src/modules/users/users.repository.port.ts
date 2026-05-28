import type { ActiveUser } from './users.types';

/**
 * Repository interface for managing user data and session life-cycles.
 * Handles database operations for active users, profile updates, and session revocations.
 */
export interface IUserRepository {
  /**
   * Finds an active (non-deleted) user by id.
   * Returns null if not found or soft-deleted.
   */
  findActiveById(id: string): Promise<ActiveUser | null>;

  /**
   * Finds an active (non-deleted) user linked to a given session id,
   * provided the session is not expired.
   * Returns null if session is invalid or user is not found/deleted.
   */
  findActiveUserBySessionId(sessionId: string): Promise<ActiveUser | null>;

  /**
   * Checks whether a user with the given email already exists (including soft-deleted).
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Checks whether an active user with the given email already exists,
   * excluding a specific user id from the check (used on profile updates).
   */
  emailExistsForOtherUser(
    email: string,
    excludeUserId: string,
  ): Promise<boolean>;

  /**
   * Creates a new user with role 'reader' and a hashed password.
   * Returns the email of the created user.
   */
  createReader(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<string>;

  /**
   * Updates the name and/or email of a user by id.
   */
  updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<void>;

  /**
   * Replaces the password hash of a user by id.
   */
  updatePasswordHash(id: string, newHash: string): Promise<void>;

  /**
   * Soft-deletes a user by setting deleted_at to the current timestamp.
   */
  softDelete(id: string): Promise<void>;

  /**
   * Hard-deletes all sessions belonging to a user.
   * Used on account deletion and password change.
   */
  revokeAllSessions(userId: string): Promise<void>;

  /**
   * Hard-deletes a single session by its id.
   * Used on signout.
   */
  revokeSession(sessionId: string): Promise<void>;
}
